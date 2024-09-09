import { dbClient } from '@/database/client'
import { NextRequest, NextResponse } from 'next/server'
import { WebhookMergeRequestEventSchema } from '@gitbeaker/rest'
import { dispatch } from '@/queue/dispatch'
import { summaryKey } from '@/queue/jobs/generate-open-pull-request-summary'

export const POST = async (request: NextRequest) => {
  const webhook_secret = request.headers.get('X-Gitlab-Token')

  const organization = await dbClient
    .selectFrom('homie.organization')
    .innerJoin(
      'gitlab.app_user',
      'gitlab.app_user.organization_id',
      'homie.organization.id',
    )
    .leftJoin(
      'slack.workspace',
      'slack.workspace.organization_id',
      'homie.organization.id',
    )
    .leftJoin(
      'homie.subscription',
      'homie.subscription.organization_id',
      'homie.organization.id',
    )
    .leftJoin(
      'trello.workspace',
      'trello.workspace.organization_id',
      'homie.organization.id',
    )
    .leftJoin(
      'asana.app_user',
      'asana.app_user.organization_id',
      'homie.organization.id',
    )
    .leftJoin('homie.plan', 'homie.plan.id', 'homie.subscription.plan_id')
    .where('gitlab.app_user.gitlab_webhook_secret', '=', webhook_secret)
    .select([
      'gitlab.app_user.gitlab_webhook_secret',
      'homie.organization.id',
      'gitlab_access_token',
      'has_unlimited_usage',
      'trello_access_token',
      'asana_access_token',
      'slack_access_token',
    ])
    .executeTakeFirst()

  if (!organization) {
    return NextResponse.json({})
  }

  const event = await request.json()

  if (!isMergeRequestEvent(event)) {
    return NextResponse.json({})
  }

  const mergeRequest = event.object_attributes

  const shouldGenerateSummary = mergeRequest.description?.includes(summaryKey)

  if (mergeRequest.action === 'reopen') {
    await dispatch('reopen_merge_request', {
      merge_request: mergeRequest,
      organization,
    })
  }

  if (mergeRequest.action === 'close') {
    await dispatch('close_merge_request', {
      merge_request: mergeRequest,
      organization,
      project: {
        default_branch: event.project.default_branch,
      },
    })
  }

  if (mergeRequest.action === 'merge') {
    await dispatch('save_merged_merge_request', {
      merge_request: mergeRequest,
      organization,
      project: {
        default_branch: event.project.default_branch,
      },
    })

    await dispatch('close_linked_tasks', {
      pull_request: {
        body: mergeRequest.description,
        title: mergeRequest.title,
        html_url: mergeRequest.url,
      },
      organization,
    })
  }

  if (mergeRequest.action === 'update' && shouldGenerateSummary) {
    await dispatch('generate_open_merge_request_summary', {
      merge_request: mergeRequest,
      organization,
    })
  }

  if (mergeRequest.action === 'open') {
    await dispatch('save_opened_merge_request', {
      merge_request: mergeRequest,
      organization,
    })
  }

  if (mergeRequest.action === 'open' && shouldGenerateSummary) {
    await dispatch('generate_open_merge_request_summary', {
      merge_request: mergeRequest,
      organization,
    })
  }

  return NextResponse.json({})
}

const isMergeRequestEvent = (
  payload: any,
): payload is WebhookMergeRequestEventSchema => {
  return payload.event_type === 'merge_request'
}

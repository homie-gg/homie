import { dbClient } from '@/database/client'
import { NextRequest, NextResponse } from 'next/server'
import { WebhookMergeRequestEventSchema } from '@gitbeaker/rest'
import { summaryKey } from '@/queue/jobs/generate-open-pull-request-summary'
import { reopenMergeRequest } from '@/queue/jobs/reopen-merge-request'
import { closeMergeRequest } from '@/queue/jobs/close-merge-request'
import { saveMergedMergeRequest } from '@/queue/jobs/save-merged-merge-request'
import { closeLinkedTasks } from '@/queue/jobs/close-linked-tasks'
import { generateOpenMergeRequestSummary } from '@/queue/jobs/generate-open-merge-request-summary'
import { saveOpenedMergeRequest } from '@/queue/jobs/save-opened-merge-request'

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
    await reopenMergeRequest.dispatch({
      merge_request: mergeRequest,
      organization,
    })
  }

  if (mergeRequest.action === 'close') {
    await closeMergeRequest.dispatch({
      merge_request: mergeRequest,
      organization,
      project: {
        default_branch: event.project.default_branch,
      },
    })
  }

  if (mergeRequest.action === 'merge') {
    await saveMergedMergeRequest.dispatch({
      merge_request: mergeRequest,
      organization,
      project: {
        default_branch: event.project.default_branch,
      },
    })

    await closeLinkedTasks.dispatch({
      pull_request: {
        body: mergeRequest.description,
        title: mergeRequest.title,
        html_url: mergeRequest.url,
      },
      organization,
    })
  }

  if (mergeRequest.action === 'update' && shouldGenerateSummary) {
    await generateOpenMergeRequestSummary.dispatch({
      merge_request: mergeRequest,
      organization,
    })
  }

  if (mergeRequest.action === 'open') {
    await saveOpenedMergeRequest.dispatch({
      merge_request: mergeRequest,
      organization,
    })
  }

  if (mergeRequest.action === 'open' && shouldGenerateSummary) {
    await generateOpenMergeRequestSummary.dispatch({
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

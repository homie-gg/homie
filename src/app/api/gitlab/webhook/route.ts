import { dbClient } from '@/database/client'
import { NextRequest, NextResponse } from 'next/server'
import { WebhookMergeRequestEventSchema } from '@gitbeaker/rest'
import { dispatch } from '@/queue/default-queue'
import { summaryKey } from '@/queue/handlers/handle-generate-open-pull-request-summary'

export const POST = async (request: NextRequest) => {
  const webhook_secret = request.headers.get('X-Gitlab-Token')

  const organization = await dbClient
    .selectFrom('voidpm.organization')
    .innerJoin(
      'gitlab.app_user',
      'gitlab.app_user.organization_id',
      'voidpm.organization.id',
    )
    .leftJoin(
      'voidpm.subscription',
      'voidpm.subscription.organization_id',
      'voidpm.organization.id',
    )
    .leftJoin(
      'trello.workspace',
      'trello.workspace.organization_id',
      'voidpm.organization.id',
    )
    .leftJoin('voidpm.plan', 'voidpm.plan.id', 'voidpm.subscription.plan_id')
    .where('gitlab.app_user.gitlab_webhook_secret', '=', webhook_secret)
    .select([
      'gitlab.app_user.gitlab_webhook_secret',
      'voidpm.organization.id',
      'gitlab_access_token',
      'is_over_plan_pr_limit',
      'pr_limit_per_month',
      'has_unlimited_usage',
      'trello_access_token',
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

  const isToDefaultBranch =
    mergeRequest.target_branch === event.project.default_branch

  const shouldGenerateSummary = mergeRequest.description?.includes(summaryKey)

  if (mergeRequest.action === 'merge' && isToDefaultBranch) {
    await dispatch('save_merged_merge_request', {
      merge_request: mergeRequest,
      organization,
    })

    await dispatch('close_linked_tasks', {
      pullRequestBody: mergeRequest.description,
      organization,
    })
  }

  if (mergeRequest.action === 'update' && shouldGenerateSummary) {
    await dispatch('generate_open_merge_request_summary', {
      merge_request: mergeRequest,
      organization,
    })
  }

  if (mergeRequest.action === 'open' && isToDefaultBranch) {
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

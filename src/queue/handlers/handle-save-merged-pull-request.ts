import { dbClient } from '@/database/client'
import { saveMergedPullRequest } from '@/lib/github/save-merged-pull-request'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { getPullRequestLogData } from '@/lib/github/get-pull-request-log-data'
import { logger } from '@/lib/log/logger'
import { SaveMergedPullRequest } from '@/queue/jobs'
import { getIsOverPlanContributorLimit } from '@/lib/billing/get-is-over-plan-contributor-limit'
import { dispatch } from '@/queue/dispatch'
import { config } from '@/config'

export async function handleSaveMergedPullRequest(job: SaveMergedPullRequest) {
  const { pull_request, installation } = job.data

  logger.debug('Start save merged PR', {
    event: 'save_merged_pull_request.start',
    data: {
      pull_request: getPullRequestLogData(pull_request),
    },
  })

  const organization = await dbClient
    .selectFrom('homie.organization')
    .innerJoin(
      'github.organization',
      'github.organization.organization_id',
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
    .leftJoin('homie.plan', 'homie.plan.id', 'homie.subscription.plan_id')
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
    .where('ext_gh_install_id', '=', installation?.id!)
    .select([
      'homie.organization.id',
      'github.organization.ext_gh_install_id',
      'has_unlimited_usage',
      'trello_access_token',
      'asana_access_token',
      'slack_access_token',
    ])
    .executeTakeFirst()

  if (!organization) {
    logger.debug('Missing organization', {
      event: 'save_merged_pull_request.missing_organization',
      data: {
        pull_request: getPullRequestLogData(pull_request),
      },
    })
    return
  }

  if (await getIsOverPlanContributorLimit({ organization })) {
    logger.debug('org over plan contributor limit', {
      event: 'save_merged_merge_request.org_over_plan_limit',
      data: {
        pull_request: getPullRequestLogData(pull_request),
        organization: getOrganizationLogData(organization),
      },
    })
    return
  }

  const pullRequest = await saveMergedPullRequest({
    pullRequest: pull_request,
    organization,
  })

  if (pullRequest) {
    await dispatch(
      'check_for_unclosed_task',
      {
        pull_request: {
          ...pullRequest,
          merged_at: pullRequest.merged_at?.toISOString() ?? null,
          created_at: pullRequest.created_at.toISOString(),
        },
        summary: pullRequest.summary,
      },
      {
        debounce: {
          key: `check_unclosed_task:pull_request:${pullRequest.id}`,
          delaySecs: 120,
        },
      },
    )
  }

  logger.debug('Finished saving merged PR', {
    event: 'save_merged_pull_request.complete',
    data: {
      pull_request: getPullRequestLogData(pull_request),
      organization: getOrganizationLogData(organization),
    },
  })
}

import { getIsOverPlanPRLimit } from '@/lib/billing/get-is-over-plan-pr-limit'
import { dbClient } from '@/lib/db/client'
import { saveMergedPullRequest } from '@/lib/github/save-merged-pull-request'
import { getOrganizationLogData } from '@/lib/log/get-organization-log-data'
import { getPullRequestLogData } from '@/lib/log/get-pull-request-log-data'
import { logger } from '@/lib/log/logger'
import { SaveMergedPullRequest } from '@/queue/jobs'

export async function handleSaveMergedPullRequest(job: SaveMergedPullRequest) {
  const { pull_request, installation } = job.data

  logger.debug('Start save merged PR', {
    event: 'save_merged_pull_request.start',
    data: {
      pull_request: getPullRequestLogData(pull_request),
    },
  })

  const organization = await dbClient
    .selectFrom('voidpm.organization')
    .innerJoin(
      'github.organization',
      'github.organization.organization_id',
      'voidpm.organization.id',
    )
    .leftJoin(
      'voidpm.subscription',
      'voidpm.subscription.organization_id',
      'voidpm.organization.id',
    )
    .leftJoin('voidpm.plan', 'voidpm.plan.id', 'voidpm.subscription.plan_id')
    .where('ext_gh_install_id', '=', installation?.id!)
    .select([
      'voidpm.organization.id',
      'github.organization.ext_gh_install_id',
      'is_over_plan_pr_limit',
      'pr_limit_per_month',
      'has_unlimited_usage',
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

  if (organization.is_over_plan_pr_limit && !organization.has_unlimited_usage) {
    logger.debug('org over plan limit', {
      event: 'save_merged_pull_request.org_over_plan_limit',
      data: {
        pull_request: getPullRequestLogData(pull_request),
        organization: getOrganizationLogData(organization),
      },
    })
    return
  }

  const isOverPlanPRLimit = await getIsOverPlanPRLimit({
    organization,
    pr_limit_per_month: organization.pr_limit_per_month,
  })

  if (isOverPlanPRLimit && !organization.has_unlimited_usage) {
    await dbClient
      .updateTable('voidpm.organization')
      .set({
        is_over_plan_pr_limit: true,
      })
      .where('voidpm.organization.id', '=', organization.id)
      .executeTakeFirstOrThrow()
    logger.debug('org over plan limit', {
      event: 'save_merged_pull_request.org_over_plan_limit',
      data: {
        pull_request: getPullRequestLogData(pull_request),
        organization: getOrganizationLogData(organization),
      },
    })

    return
  }

  await saveMergedPullRequest({
    pullRequest: pull_request,
    organization,
  })
}

import { getIsOverPlanPRLimit } from '@/lib/billing/get-is-over-plan-pr-limit'
import { dbClient } from '@/lib/db/client'
import { getOrganizationLogData } from '@/lib/log/get-organization-log-data'
import { getPullRequestLogData } from '@/lib/log/get-pull-request-log-data'
import { logger } from '@/lib/log/logger'
import { SaveOpenedPullRequest } from '@/queue/jobs'
import { parseISO } from 'date-fns'

export async function handleSaveOpenedPullRequest(job: SaveOpenedPullRequest) {
  const { pull_request, installation } = job.data

  logger.debug('Start save opened PR', {
    event: 'save_opened_pull_request.start',
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
      'has_unlimited_usage',
      'pr_limit_per_month',
    ])
    .executeTakeFirst()

  if (!organization) {
    logger.debug('Missing organization', {
      event: 'save_opened_pull_request.missing_organization',
      data: {
        pull_request: getPullRequestLogData(pull_request),
      },
    })
    return
  }

  if (organization.is_over_plan_pr_limit && !organization.has_unlimited_usage) {
    logger.debug('org over plan limit', {
      event: 'save_opened_pull_request.org_over_plan_limit',
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
      event: 'save_opened_pull_request.org_over_plan_limit',
      data: {
        pull_request: getPullRequestLogData(pull_request),
        organization: getOrganizationLogData(organization),
      },
    })

    return
  }

  // Create Github User if doesn't exits
  const contributor = await dbClient
    .insertInto('voidpm.contributor')
    .values({
      ext_gh_user_id: pull_request.user.id,
      organization_id: organization.id,
      username: pull_request.user.login ?? '',
    })
    .onConflict((oc) =>
      oc.column('ext_gh_user_id').doUpdateSet({
        organization_id: organization.id,
        username: pull_request.user?.login ?? '',
      }),
    )
    .returning('id')
    .executeTakeFirstOrThrow()

  const repo = await dbClient
    .insertInto('github.repo')
    .values({
      organization_id: organization.id,
      name: pull_request.base.repo.name,
      html_url: pull_request.base.repo.html_url,
      ext_gh_repo_id: pull_request.base.repo.id,
    })
    .onConflict((oc) =>
      oc.column('ext_gh_repo_id').doUpdateSet({
        organization_id: organization.id,
        name: pull_request.base.repo.name,
        html_url: pull_request.base.repo.html_url,
      }),
    )
    .returning('id')
    .executeTakeFirstOrThrow()

  await dbClient
    .insertInto('github.pull_request')
    .values({
      created_at: parseISO(pull_request.created_at),
      ext_gh_pull_request_id: pull_request.id,
      organization_id: organization.id,
      contributor_id: contributor.id,
      title: pull_request.title,
      html_url: pull_request.html_url,
      repo_id: repo.id,
      body: pull_request.body ?? '',
      number: pull_request.number,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  logger.debug('Finished saving opened PR', {
    event: 'save_opened_pull_request.complete',
    data: {
      pull_request: getPullRequestLogData(pull_request),
      organization: getOrganizationLogData(organization),
    },
  })
}

import { dbClient } from '@/database/client'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { getPullRequestLogData } from '@/lib/github/get-pull-request-log-data'
import { logger } from '@/lib/log/logger'
import { SaveOpenedPullRequest } from '@/queue/jobs'
import { parseISO } from 'date-fns'
import { getIsOverPlanContributorLimit } from '@/lib/billing/get-is-over-plan-contributor-limit'

export async function handleSaveOpenedPullRequest(job: SaveOpenedPullRequest) {
  const { pull_request, installation } = job.data

  logger.debug('Start save opened PR', {
    event: 'save_opened_pull_request:start',
    pull_request: getPullRequestLogData(pull_request),
  })

  const organization = await dbClient
    .selectFrom('homie.organization')
    .innerJoin(
      'github.organization',
      'github.organization.organization_id',
      'homie.organization.id',
    )
    .leftJoin(
      'homie.subscription',
      'homie.subscription.organization_id',
      'homie.organization.id',
    )
    .leftJoin('homie.plan', 'homie.plan.id', 'homie.subscription.plan_id')
    .where('ext_gh_install_id', '=', installation?.id!)
    .select([
      'homie.organization.id',
      'github.organization.ext_gh_install_id',
      'has_unlimited_usage',
    ])
    .executeTakeFirst()

  if (!organization) {
    logger.debug('Missing organization', {
      event: 'save_opened_pull_request.missing_organization',
      pull_request: getPullRequestLogData(pull_request),
    })
    return
  }

  if (await getIsOverPlanContributorLimit({ organization })) {
    logger.debug('org over plan limit', {
      event: 'save_opened_pull_request:org_over_plan_limit',
      pull_request: getPullRequestLogData(pull_request),
      organization: getOrganizationLogData(organization),
    })
    return
  }

  // Create Github User if doesn't exits
  const contributor = await dbClient
    .insertInto('homie.contributor')
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

  const owner = pull_request.base.repo.full_name.split('/')[0]

  const repo = await dbClient
    .insertInto('github.repo')
    .values({
      organization_id: organization.id,
      owner,
      name: pull_request.base.repo.name,
      html_url: pull_request.base.repo.html_url,
      ext_gh_repo_id: pull_request.base.repo.id,
    })
    .onConflict((oc) =>
      oc.column('ext_gh_repo_id').doUpdateSet({
        organization_id: organization.id,
        name: pull_request.base.repo.name,
        owner,
        html_url: pull_request.base.repo.html_url,
      }),
    )
    .returning('id')
    .executeTakeFirstOrThrow()

  await dbClient
    .insertInto('homie.pull_request')
    .values({
      created_at: parseISO(pull_request.created_at),
      ext_gh_pull_request_id: pull_request.id,
      organization_id: organization.id,
      contributor_id: contributor.id,
      title: pull_request.title,
      html_url: pull_request.html_url,
      github_repo_id: repo.id,
      body: pull_request.body ?? '',
      number: pull_request.number,
      target_branch: pull_request.base.ref,
      source_branch: pull_request.head.ref,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  logger.debug('Finished saving opened PR', {
    event: 'save_opened_pull_request:complete',
    pull_request: getPullRequestLogData(pull_request),
    organization: getOrganizationLogData(organization),
  })
}

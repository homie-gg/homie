import { dbClient } from '@/database/client'
import { ReopenPullRequest } from '@/queue/jobs'
import { logger } from '@/lib/log/logger'
import { getPullRequestLogData } from '@/lib/github/get-pull-request-log-data'
import { getIsOverPlanContributorLimit } from '@/lib/billing/get-is-over-plan-contributor-limit'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { parseISO } from 'date-fns'

export async function handleReopenPullRequest(job: ReopenPullRequest) {
  const { pull_request, installation } = job.data

  logger.debug('Handle reopen pull request', {
    event: 'handle_reopen_pull_request:start',
  })

  const organization = await dbClient
    .selectFrom('homie.organization')
    .innerJoin(
      'github.organization',
      'github.organization.organization_id',
      'homie.organization.id',
    )

    .where('ext_gh_install_id', '=', installation?.id!)
    .select(['homie.organization.id'])
    .executeTakeFirst()

  if (!organization) {
    logger.debug('Missing organization', {
      event: 'handle_reopen_pull_request:start',
      data: {
        pull_request: getPullRequestLogData(pull_request),
      },
    })
    return
  }

  if (await getIsOverPlanContributorLimit({ organization })) {
    logger.debug('org over plan limit', {
      event: 'handle_reopen_pull_request:org_over_plan_limit',
      data: {
        pull_request: getPullRequestLogData(pull_request),
        organization: getOrganizationLogData(organization),
      },
    })
    return
  }

  const pullRequest = await dbClient
    .selectFrom('homie.pull_request')
    .where('ext_gh_pull_request_id', '=', pull_request.id)
    .select(['id'])
    .executeTakeFirst()

  if (pullRequest) {
    await dbClient
      .updateTable('homie.pull_request')
      .where('id', '=', pullRequest.id)
      .set({
        closed_at: null,
      })
      .executeTakeFirstOrThrow()

    logger.debug('Reopened existing pr', {
      event: 'handle_reopen_pull_request:reopened_existing_pr',
      data: {
        pull_request: getPullRequestLogData(pull_request),
      },
    })
    return
  }

  // Save any re-opened PRs we're not tracking
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
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  logger.debug('Saved untracked reopened PR', {
    event: 'handle_reopen_pull_request:save_untracked_pr',
    data: {
      pull_request: getPullRequestLogData(pull_request),
      organization: getOrganizationLogData(organization),
    },
  })
}

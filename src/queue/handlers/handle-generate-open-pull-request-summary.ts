import { summarizeGithubPullRequest } from '@/lib/github/summarize-github-pull-request'
import { dbClient } from '@/database/client'
import { createGithubClient } from '@/lib/github/create-github-client'
import { GenerateOpenPullRequestSummary } from '@/queue/jobs'
import { getLinkedIssuesAndTasksInPullRequest } from '@/lib/github/get-linked-issues-and-tasks-in-pull-request'
import { getIsOverPlanContributorLimit } from '@/lib/billing/get-is-over-plan-contributor-limit'
import { getOverContributorLimitMessage } from '@/lib/billing/get-over-contributor-limit-message'
import { logger } from '@/lib/log/logger'
import { getPullRequestLogData } from '@/lib/github/get-pull-request-log-data'

/**
 * homie will replace this string inside a PR body with a generated summary.
 */
export const summaryKey = ':homie-summary:'

export async function handleGenerateOpenPullRequestSummary(
  job: GenerateOpenPullRequestSummary,
) {
  const { pull_request, installation } = job.data

  const organization = await dbClient
    .selectFrom('homie.organization')
    .innerJoin(
      'github.organization',
      'github.organization.organization_id',
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
    .where('ext_gh_install_id', '=', installation?.id!)
    .select([
      'homie.organization.id',
      'github.organization.ext_gh_install_id',
      'has_unlimited_usage',
      'trello_access_token',
      'asana_access_token',
    ])
    .executeTakeFirst()

  logger.debug('Generate PR Summary - Start', {
    event: 'generate_pr_summary:start',
    pull_request: getPullRequestLogData(pull_request),
  })

  if (!organization) {
    logger.debug('Generate PR Summary - Missing Org', {
      event: 'generate_pr_summary:missing_org',
      pull_request: getPullRequestLogData(pull_request),
    })
    return
  }

  const github = await createGithubClient({
    installationId: organization.ext_gh_install_id,
  })

  const owner = pull_request.base.repo.full_name.split('/')[0]

  if (await getIsOverPlanContributorLimit({ organization })) {
    logger.debug('Generate PR Summary - Over Plan Contributor Limit', {
      event: 'generate_pr_summary:over_plan_contributor_limit',
      pull_request: getPullRequestLogData(pull_request),
    })
    await github.rest.pulls.update({
      owner,
      repo: pull_request.base.repo.name,
      pull_number: pull_request.number,
      body: pull_request.body?.replace(
        summaryKey,
        getOverContributorLimitMessage(),
      ),
    })
    return
  }

  const issue = await getLinkedIssuesAndTasksInPullRequest({
    pullRequest: pull_request,
    organization,
  })
  console.log('ISSUE: ', issue)

  logger.debug('Generate PR Summary - Got Issue', {
    event: 'generate_pr_summary:got_issue',
    pull_request: getPullRequestLogData(pull_request),
    issue,
  })

  // Create Github User if doesn't exits
  await dbClient
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

  const { summary } = await summarizeGithubPullRequest({
    pullRequest: {
      id: pull_request.id,
      number: pull_request.number,
      created_at: pull_request.created_at,
      body: pull_request.body?.replaceAll(summaryKey, '') ?? '',
      repo_id: pull_request.base.repo.id,
      title: pull_request.title,
      merged_at: pull_request.merged_at!,
      base: pull_request.base,
      html_url: pull_request.html_url,
    },
    repo: pull_request.base.repo.name,
    owner,
    github,
    issue,
    length: 'short',
  })

  logger.debug('Generate PR Summary - Got Summary', {
    event: 'generate_pr_summary:got_summary',
    pull_request: getPullRequestLogData(pull_request),
    issue,
    summary,
  })

  const bodyWithSummary = pull_request.body
    ?.replace(summaryKey, summary)
    .replace(summaryKey, 'summary key') // avoid infinite loop of summaries by replacing the key if it exists

  console.log('result: ', bodyWithSummary);

  await github.rest.pulls.update({
    owner,
    repo: pull_request.base.repo.name,
    pull_number: pull_request.number,
    body: bodyWithSummary,
  })
}

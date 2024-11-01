import { calculatePullRequestComplexity } from '@/lib/ai/calculate-pull-request-complexity'
import { summarizeGithubPullRequest } from '@/lib/github/summarize-github-pull-request'
import { dbClient } from '@/database/client'
import { createGithubClient } from '@/lib/github/create-github-client'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { getPullRequestLogData } from '@/lib/github/get-pull-request-log-data'
import { logger } from '@/lib/log/logger'
import { parseISO } from 'date-fns'
import { getLinkedIssuesAndTasksInPullRequest } from '@/lib/github/get-linked-issues-and-tasks-in-pull-request'
import { getReferencedSlackMessages } from '@/lib/slack/get-referenced-slack-messages'
import { embedPullRequestChanges } from '@/lib/ai/embed-pull-request-changes'
import { embedPullRequestDiff } from '@/lib/ai/embed-pull-request-diff'

interface SaveMergedPullRequestParams {
  pullRequest: {
    created_at: string
    html_url: string
    title: string
    merged_at: string | null
    body: string | null
    id: number
    number: number
    user: {
      id: number
      login: string
    }
    head: {
      ref: string
    }
    base: {
      ref: string
      repo: {
        name: string
        html_url: string
        id: number
        default_branch: string
        full_name: string
      }
    }
  }
  organization: {
    id: number
    ext_gh_install_id: number
    trello_access_token: string | null
    asana_access_token: string | null
    slack_access_token: string | null
  }
}

export async function saveMergedPullRequest(
  params: SaveMergedPullRequestParams,
) {
  const { pullRequest, organization } = params

  logger.debug('Start Save pull request', {
    event: 'save_pull_request.start',
    organization: getOrganizationLogData(organization),
    pull_request: getPullRequestLogData(pullRequest),
  })

  /**
   * Whether PR was successfully merged (not closed).
   */
  if (!pullRequest.merged_at) {
    logger.debug('Missing merged_at - abort', {
      event: 'save_pull_request.missing_merged_at',
      organization: getOrganizationLogData(organization),
      pull_request: getPullRequestLogData(pullRequest),
    })
    return
  }

  // Create Github User if doesn't exits
  const contributor = await dbClient
    .insertInto('homie.contributor')
    .values({
      ext_gh_user_id: pullRequest.user.id,
      organization_id: organization.id,
      username: pullRequest.user.login ?? '',
    })
    .onConflict((oc) =>
      oc.column('ext_gh_user_id').doUpdateSet({
        organization_id: organization.id,
        username: pullRequest.user?.login ?? '',
      }),
    )
    .returning('id')
    .executeTakeFirstOrThrow()

  const owner = pullRequest.base.repo.full_name.split('/')[0]

  const repo = await dbClient
    .insertInto('github.repo')
    .values({
      organization_id: organization.id,
      owner,
      name: pullRequest.base.repo.name,
      html_url: pullRequest.base.repo.html_url,
      ext_gh_repo_id: pullRequest.base.repo.id,
    })
    .onConflict((oc) =>
      oc.column('ext_gh_repo_id').doUpdateSet({
        organization_id: organization.id,
        owner,
        name: pullRequest.base.repo.name,
        html_url: pullRequest.base.repo.html_url,
      }),
    )
    .returning('id')
    .executeTakeFirstOrThrow()

  const github = await createGithubClient({
    installationId: organization.ext_gh_install_id,
  })

  const issue = await getLinkedIssuesAndTasksInPullRequest({
    pullRequest,
    organization,
  })

  const conversation = organization.slack_access_token
    ? await getReferencedSlackMessages({
        pullRequestBody: pullRequest.body,
        organization: {
          id: organization.id,
          slack_access_token: organization.slack_access_token,
        },
      })
    : null

  const { summary, diff } = await summarizeGithubPullRequest({
    pullRequest: {
      id: pullRequest.id,
      body: pullRequest.body,
      repo_id: pullRequest.base.repo.id,
      number: pullRequest.number,
      title: pullRequest.title,
      merged_at: pullRequest.merged_at,
      base: pullRequest.base,
      html_url: pullRequest.html_url,
      created_at: pullRequest.created_at,
    },
    repo: pullRequest.base.repo.name,
    owner,
    github,
    issue,
    length: 'long',
    conversation,
  })

  const complexityScoreResult = diff
    ? await calculatePullRequestComplexity({ diff })
    : null

  if (complexityScoreResult) {
    logger.debug('Calculated complexity score', {
      event: 'save_pull_request.calculated_complexity_score',
      organization: getOrganizationLogData(organization),
      ai_call: true,
      pull_request: getPullRequestLogData(pullRequest),
      prompt: complexityScoreResult.prompt,
      complexity_score: complexityScoreResult.score,
      failed: Boolean(complexityScoreResult.error),
      error: complexityScoreResult.error,
    })
  }

  const wasMergedToDefaultBranch =
    pullRequest.base.ref === pullRequest.base.repo.default_branch

  const embedMetadata = {
    type: 'pr_summary',
    pull_request_id: pullRequest.id,
    pull_request_title: pullRequest.title,
    pull_request_url: pullRequest.html_url,
    ext_gh_pull_request_id: pullRequest.id,
    organization_id: organization.id,
    contributor_id: contributor.id,
    repo_id: repo.id,
    merged_at: pullRequest.merged_at,
    target_branch: pullRequest.base.ref,
    source_branch: pullRequest.head.ref,
    was_merged_to_default_branch: wasMergedToDefaultBranch,
  }

  const pullRequestRecord = await dbClient
    .insertInto('homie.pull_request')
    .values({
      created_at: parseISO(pullRequest.created_at),
      ext_gh_pull_request_id: String(pullRequest.id),
      organization_id: organization.id,
      contributor_id: contributor.id,
      title: pullRequest.title,
      html_url: pullRequest.html_url,
      github_repo_id: repo.id,
      body: pullRequest.body ?? '',
      merged_at: parseISO(pullRequest.merged_at),
      number: pullRequest.number,
      embed_value: summary,
      embed_metadata: embedMetadata,
      source_branch: pullRequest.head.ref,
      target_branch: pullRequest.base.ref,
      was_merged_to_default_branch: wasMergedToDefaultBranch,
      complexity_score: complexityScoreResult?.score,
    })
    .onConflict((oc) =>
      oc.column('ext_gh_pull_request_id').doUpdateSet({
        created_at: parseISO(pullRequest.created_at),
        organization_id: organization.id,
        contributor_id: contributor.id,
        title: pullRequest.title,
        html_url: pullRequest.html_url,
        github_repo_id: repo.id,
        body: pullRequest.body ?? '',
        merged_at: parseISO(pullRequest.merged_at!),
        number: pullRequest.number,
        embed_value: summary,
        embed_metadata: embedMetadata,
        source_branch: pullRequest.head.ref,
        target_branch: pullRequest.base.ref,
        was_merged_to_default_branch: wasMergedToDefaultBranch,
      }),
    )
    .returningAll()
    .executeTakeFirstOrThrow()

  if (!wasMergedToDefaultBranch) {
    return
  }

  await embedPullRequestChanges({
    pullRequest: pullRequestRecord,
    summary,
    wasMergedToDefaultBranch,
  })

  if (diff) {
    await embedPullRequestDiff({
      diff,
      summary,
      pullRequest: pullRequestRecord,
    })
  }

  return {
    ...pullRequestRecord,
    summary,
  }
}

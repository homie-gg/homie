import { embedGithubDiff } from '@/lib/github/embed-github-diff'
import { summarizeGithubPullRequest } from '@/lib/github/summarize-github-pull-request'
import { dbClient } from '@/database/client'
import { createGithubClient } from '@/lib/github/create-github-client'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { getPullRequestLogData } from '@/lib/github/get-pull-request-log-data'
import { logger } from '@/lib/log/logger'
import { parseISO } from 'date-fns'
import { getLinkedIssuesAndTasksInPullRequest } from '@/lib/github/get-linked-issues-and-tasks-in-pull-request'
import { embedCodeChange } from '@/lib/ai/embed-code-change'

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
  }
}

export async function saveMergedPullRequest(
  params: SaveMergedPullRequestParams,
) {
  const { pullRequest, organization } = params

  logger.debug('Start Save pull request', {
    event: 'save_pull_request.start',
    data: {
      organization: getOrganizationLogData(organization),
      pull_request: getPullRequestLogData(pullRequest),
    },
  })

  /**
   * Whether PR was successfully merged (not closed).
   */
  if (!pullRequest.merged_at) {
    logger.debug('Missing merged_at - abort', {
      event: 'save_pull_request.missing_merged_at',
      data: {
        organization: getOrganizationLogData(organization),
        pull_request: getPullRequestLogData(pullRequest),
      },
    })
    return
  }

  /**
   * Wether the PR was to default. e.g., 'main'
   */
  const isDefaultBranchPR =
    pullRequest.base.ref === pullRequest.base.repo.default_branch

  if (!isDefaultBranchPR) {
    logger.debug('Was not merge to default branch - abort', {
      event: 'save_pull_request.not_merged_to_default',
      data: {
        organization: getOrganizationLogData(organization),
        pull_request: getPullRequestLogData(pullRequest),
      },
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
  })

  const embed_metadata = {
    type: 'pr_summary',
    title: pullRequest.title,
    url: pullRequest.html_url,
    ext_gh_pull_request_id: pullRequest.id,
    organization_id: organization.id,
    contributor_id: contributor.id,
    repo_id: repo.id,
    merged_at: pullRequest.merged_at,
  }

  const pullRequestRecord = await dbClient
    .insertInto('homie.pull_request')
    .values({
      created_at: parseISO(pullRequest.created_at),
      ext_gh_pull_request_id: pullRequest.id,
      organization_id: organization.id,
      contributor_id: contributor.id,
      title: pullRequest.title,
      html_url: pullRequest.html_url,
      github_repo_id: repo.id,
      body: pullRequest.body ?? '',
      merged_at: parseISO(pullRequest.merged_at),
      number: pullRequest.number,
      embed_value: summary,
      embed_metadata,
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
        embed_metadata,
      }),
    )
    .returningAll()
    .executeTakeFirstOrThrow()

  await embedCodeChange({
    label: 'Pull Request',
    title: pullRequest.title,
    url: pullRequest.html_url,
    summary,
    metadata: embed_metadata,
    contributor: pullRequest.user.login,
    mergedAt: pullRequestRecord.merged_at,
  })

  if (diff) {
    await embedGithubDiff({
      pullRequest: pullRequestRecord,
      diff,
      summary,
      contributor: pullRequest.user.login,
      organization_id: organization.id,
    })
  }
}

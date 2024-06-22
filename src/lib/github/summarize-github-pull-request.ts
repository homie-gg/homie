import { summarizeCodeChange } from '@/lib/ai/summarize-code-change'
import { GithubClient } from '@/lib/github/create-github-client'
import { getPullRequestLogData } from '@/lib/github/get-pull-request-log-data'
import { logger } from '@/lib/log/logger'

interface SummarizeGithubPullRequestParams {
  pullRequest: {
    id: number
    title: string
    created_at: string
    body: string | null
    repo_id: number
    number: number
    merged_at: string
    html_url: string
    base: {
      ref: string
    }
  }
  repo: string
  owner: string
  github: GithubClient
  issue: string | null
  length: 'short' | 'long'
}

export async function summarizeGithubPullRequest(
  params: SummarizeGithubPullRequestParams,
) {
  const { pullRequest, github, repo, owner, issue, length: type } = params

  logger.debug('Generate PR Summary - Got Summary', {
    event: 'summarize_pr:start',
    pull_request: getPullRequestLogData(pullRequest),
    issue,
  })

  const diff = await github.rest.pulls
    .get({
      pull_number: pullRequest.number,
      headers: {
        accept: 'application/vnd.github.v3.diff',
      },
      repo,
      owner,
    })
    .then((res) => res.data as unknown as string) // diff is a string
    .catch(() => null) // ignore fails. eg. too many files

  logger.debug('Generate PR Summary - Got Diff', {
    event: 'summarize_pr:got_diff',
    pull_request: getPullRequestLogData(pullRequest),
    issue,
    diff,
  })

  const summary = await summarizeCodeChange({
    title: pullRequest.title,
    diff,
    issue,
    body: pullRequest.body,
    length: type,
    logData: {
      pull_request: getPullRequestLogData(pullRequest),
      issue,
      diff,
    },
  })

  return { summary, diff }
}

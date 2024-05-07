import { summarizeCodeChangeParams } from '@/lib/ai/summarize-code-change'
import { GithubClient } from '@/lib/github/create-github-client'

interface SummarizeGithubPullRequestParams {
  pullRequest: {
    title: string
    body: string | null
    repo_id: number
    pull_number: number
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

  const diff = await github.rest.pulls
    .get({
      pull_number: pullRequest.pull_number,
      headers: {
        accept: 'application/vnd.github.v3.diff',
      },
      repo,
      owner,
    })
    .then((res) => res.data as unknown as string) // diff is a string
    .catch(() => null) // ignore fails. eg. too many files

  const summary = await summarizeCodeChangeParams({
    title: pullRequest.title,
    diff,
    issue,
    body: pullRequest.body,
    length: type,
  })

  return { summary, diff }
}

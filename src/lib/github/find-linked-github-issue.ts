import { GithubClient } from '@/lib/github/create-github-client'

/**
 * Reference: https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue
 */
export const linkIssueKeywords = [
  'close',
  'closes',
  'closed',
  'fix',
  'fixes',
  'fixed',
  'resolve',
  'resolves',
  'resolved',
]

interface GetLinkedIssueParams {
  pullRequest: {
    body: string | null
  }
  repo: string
  owner: string
  github: GithubClient
}
export async function findLinkedGithubIssue(params: GetLinkedIssueParams) {
  const { pullRequest, github: githubClient, owner, repo } = params

  if (!pullRequest.body) {
    return null
  }

  const keywords = linkIssueKeywords.join('|')

  const regex = new RegExp(`(${keywords})\\s*#(\\d+)`)

  const matches = pullRequest.body.match(regex)

  if (!matches || matches.length !== 3) {
    return null
  }

  const issueNumber = parseInt(matches[2])
  if (isNaN(issueNumber)) {
    return null
  }

  const issue = await githubClient.rest.issues.get({
    issue_number: issueNumber,
    repo,
    owner,
  })

  return issue.data
}

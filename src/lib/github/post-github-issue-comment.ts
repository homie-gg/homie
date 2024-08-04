import { createGithubClient } from '@/lib/github/create-github-client'

interface PostGithubIssueCommentParams {
  installationId: number
  repo: string
  owner: string
  issueNumber: number
  body: string
}

export async function postGithubIssueComment(
  params: PostGithubIssueCommentParams,
) {
  const { installationId, repo, owner, issueNumber, body } = params

  const github = await createGithubClient({
    installationId,
  })

  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body,
  })
}

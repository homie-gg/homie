import { createGithubClient } from '../../lib/github/create-github-client'
import { addOrUpdatePRComment } from '../../lib/github/manage-pr-comments'

interface HandlePREventParams {
  installationId: number
  owner: string
  repo: string
  pullNumber: number
}

export async function handlePREvent(
  params: HandlePREventParams,
): Promise<void> {
  const { installationId, owner, repo, pullNumber } = params

  const client = await createGithubClient({ installationId })

  // Fetch PR details
  const { data: pullRequest } = await client.rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
  })

  // Generate summary (you may want to implement a more sophisticated summary generation)
  const summary = `
    Title: ${pullRequest.title}
    Description: ${pullRequest.body || 'No description provided'}
    Files changed: ${pullRequest.changed_files}
    Additions: ${pullRequest.additions}
    Deletions: ${pullRequest.deletions}
  `

  // Add or update the PR comment
  await addOrUpdatePRComment(client, owner, repo, pullNumber, summary)
}

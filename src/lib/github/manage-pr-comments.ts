import { GithubClient } from './create-github-client'

const HOMIE_SUMMARY_MARKER = 'Homie Summary'

export async function addOrUpdatePRComment(
  client: GithubClient,
  owner: string,
  repo: string,
  pullNumber: number,
  summary: string,
): Promise<void> {
  const existingComments = await client.rest.issues.listComments({
    owner,
    repo,
    issue_number: pullNumber,
  })

  const homieSummaryComment = existingComments.data.find((comment) =>
    comment.body?.includes(HOMIE_SUMMARY_MARKER),
  )

  const commentBody = `## ${HOMIE_SUMMARY_MARKER}\n\n${summary}`

  if (homieSummaryComment) {
    await client.rest.issues.updateComment({
      owner,
      repo,
      comment_id: homieSummaryComment.id,
      body: commentBody,
    })
  } else {
    await client.rest.issues.createComment({
      owner,
      repo,
      issue_number: pullNumber,
      body: commentBody,
    })
  }
}

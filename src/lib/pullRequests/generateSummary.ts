import { Octokit } from '@octokit/rest'
import { Gitlab } from '@gitbeaker/node'
import { createGithubClient } from '../github/create-github-client'
import { generatePullRequestSummary } from '../ai/generate-pull-request-summary'

interface GenerateSummaryParams {
  title: string
  body: string
  diffUrl: string
  organizationId: number
}

async function generateSummary({ title, body, diffUrl, organizationId }: GenerateSummaryParams): Promise<string> {
  return await generatePullRequestSummary({
    title,
    body,
    diffUrl,
    organizationId,
  })
}

export async function createOrUpdateGithubComment(
  installationId: number,
  owner: string,
  repo: string,
  prNumber: number,
  summary: string
): Promise<void> {
  const octokit = await createGithubClient({ installationId })
  
  const { data: comments } = await octokit.issues.listComments({
    owner,
    repo,
    issue_number: prNumber,
  })

  const existingComment = comments.find(comment => 
    comment.body?.includes('<!--- Homie Summary Start -->')
  )

  const commentBody = `<!--- Homie Summary Start -->\n${summary}\n<!--- Homie Summary End -->`

  if (existingComment) {
    await octokit.issues.updateComment({
      owner,
      repo,
      comment_id: existingComment.id,
      body: commentBody,
    })
  } else {
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: commentBody,
    })
  }
}

export async function createOrUpdateGitlabComment(
  accessToken: string,
  projectId: number,
  mergeRequestIid: number,
  summary: string
): Promise<void> {
  const gitlab = new Gitlab({ token: accessToken })

  const comments = await gitlab.MergeRequestNotes.all(projectId, mergeRequestIid)

  const existingComment = comments.find(comment => 
    comment.body?.includes('<!--- Homie Summary Start -->')
  )

  const commentBody = `<!--- Homie Summary Start -->\n${summary}\n<!--- Homie Summary End -->`

  if (existingComment) {
    await gitlab.MergeRequestNotes.edit(projectId, mergeRequestIid, existingComment.id, commentBody)
  } else {
    await gitlab.MergeRequestNotes.create(projectId, mergeRequestIid, commentBody)
  }
}

export { generateSummary }

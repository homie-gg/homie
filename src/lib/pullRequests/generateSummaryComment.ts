import { Octokit } from '@octokit/rest'
import { Gitlab } from '@gitbeaker/node'
import { createCompletion } from '../ai/openai'

interface PullRequestData {
  title: string
  body: string
  diffUrl: string
}

async function generateSummary(prData: PullRequestData): Promise<string> {
  const prompt = `Summarize the following pull request:
Title: ${prData.title}
Description: ${prData.body}
Diff URL: ${prData.diffUrl}

Please provide a concise summary of the changes, their purpose, and any potential impacts.`

  const summary = await createCompletion({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 250,
  })

  return summary.trim()
}

export async function addGitHubSummaryComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number,
  prData: PullRequestData,
): Promise<void> {
  const summary = await generateSummary(prData)

  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: pullNumber,
    body: `## Homie Summary\n\n${summary}`,
  })
}

export async function addGitLabSummaryComment(
  gitlab: Gitlab,
  projectId: number,
  mergeRequestIid: number,
  prData: PullRequestData,
): Promise<void> {
  const summary = await generateSummary(prData)

  await gitlab.MergeRequestNotes.create(projectId, mergeRequestIid, {
    body: `## Homie Summary\n\n${summary}`,
  })
}

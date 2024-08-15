import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

interface CheckPullRequestAddressesSimilarIssueParams {
  task: {
    name: string
    description: string
  }
  pullRequest: {
    title: string
    body: string | null
    summary: string
  }
}

const checkPullRequestAddressesSimilarIssueResponse = z.object({
  is_similar: z
    .boolean()
    .describe(
      'Whether the given pull request addresses a similar issue to the task in terms of code implementation.',
    ),
})

type CheckPullRequestAddressesSimilarIssueResult =
  | {
      failed: true
      error: string | null
      prompt: string
    }
  | {
      failed: false
      isSimilar: boolean
      prompt: string
    }

export async function checkPullRequestAddressesSimilarIssue(
  params: CheckPullRequestAddressesSimilarIssueParams,
): Promise<CheckPullRequestAddressesSimilarIssueResult> {
  const { task, pullRequest } = params

  const openAI = new OpenAI()

  const prompt = `Determine whether the following PULL REQUEST addresses a similar issue to the TASK in terms of code implementation, and can be used as a reference.
TASK:
${task.name} - ${task.description}
PULL REQUEST:
${pullRequest.title}
${pullRequest.body}
${pullRequest.summary}
`

  const result = await openAI.beta.chat.completions.parse({
    model: 'gpt-4o-2024-08-06',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful coding assistant.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    response_format: zodResponseFormat(
      checkPullRequestAddressesSimilarIssueResponse,
      'checkPullRequestAddressesSimilarIssueResult',
    ),
  })
  const output = result.choices[0].message

  if (!output?.parsed || output.refusal) {
    return {
      failed: true,
      error: output.refusal,
      prompt,
    }
  }

  return {
    failed: false,
    isSimilar: output.parsed.is_similar,
    prompt,
  }
}

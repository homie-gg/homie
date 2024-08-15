import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

interface CheckIsReferencePullRequestParams {
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

const checkIsReferencePullRequestResponse = z.object({
  is_reference: z
    .boolean()
    .describe(
      'Whether the given pull request can be a helpful reference to implement the task in terms of code implementation.',
    ),
})

type CheckIsReferencePullRequestResult =
  | {
      failed: true
      error: string | null
      prompt: string
    }
  | {
      failed: false
      isReference: boolean
      prompt: string
    }

export async function checkIsReferencePullRequest(
  params: CheckIsReferencePullRequestParams,
): Promise<CheckIsReferencePullRequestResult> {
  const { task, pullRequest } = params

  const openAI = new OpenAI()

  const prompt = `Determine whether the following PULL REQUEST can be referenced in helping to complete the following TASK.
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
      checkIsReferencePullRequestResponse,
      'checkIsReferencePullRequestResponse',
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
    isReference: output.parsed.is_reference,
    prompt,
  }
}

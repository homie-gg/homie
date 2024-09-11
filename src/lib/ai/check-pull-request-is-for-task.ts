import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

interface CheckPullRequestIsForTaskParams {
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

const checkPullRequestIsForTaskParams = z.object({
  is_match: z
    .boolean()
    .describe('Whether the given pull request addresses the target task'),
})

type CheckPullRequestIsForTaskResult =
  | {
      failed: true
      error: string | null
      prompt: string
    }
  | {
      failed: false
      isMatch: boolean
      prompt: string
    }

export async function checkPullRequestIsForTask(
  params: CheckPullRequestIsForTaskParams,
): Promise<CheckPullRequestIsForTaskResult> {
  const { task, pullRequest } = params

  const openAI = new OpenAI()

  const prompt = `Does the following PULL REQUEST address the TASK? Answer with TRUE/FALSE only.
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
      checkPullRequestIsForTaskParams,
      'checkPullRequestIsForTaskParams',
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
    isMatch: output.parsed.is_match,
    prompt,
  }
}

import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

interface CheckIsTaskDuplicateParams {
  taskA: {
    name: string
    description: string
  }
  taskB: {
    name: string
    description: string
  }
}

const checkIsDuplicateResponse = z.object({
  is_duplicate: z.boolean().describe('Whether the two tasks are the same'),
})

type CheckIsDuplicateResult =
  | {
      failed: true
      error: string | null
      prompt: string
    }
  | {
      failed: false
      isDuplicate: boolean
      prompt: string
    }

export async function checkIsDuplicateTask(
  params: CheckIsTaskDuplicateParams,
): Promise<CheckIsDuplicateResult> {
  const { taskA, taskB } = params

  const openAI = new OpenAI()

  const prompt = `There are two tasks, TASK A and TASK B. Determine if the two tasks are wanting to do the same thing. Answer must be TRUE/FALSE only.
TASK A:
${taskA.name} - ${taskA.description}
TASK B:
${taskB.name} - ${taskB.description}
`

  const result = await openAI.beta.chat.completions.parse({
    model: 'gpt-4o-2024-08-06',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful project manager.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    response_format: zodResponseFormat(
      checkIsDuplicateResponse,
      'checkIsDuplicateResponse',
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
    isDuplicate: output.parsed.is_duplicate,
    prompt,
  }
}

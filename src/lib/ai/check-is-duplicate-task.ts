import { logger } from '@/lib/log/logger'
import { createOpenAIClient } from '@/lib/open-ai/create-open-ai-client'
import { zodResponseFormat } from 'openai/helpers/zod.mjs'
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
  logData?: Record<string, any>
}

const checkIsDuplicateResponse = z.object({
  is_duplicate: z.boolean().describe('Whether the two tasks are the same'),
})

export async function checkIsDuplicateTask(params: CheckIsTaskDuplicateParams) {
  const { taskA, taskB, logData } = params

  const openAI = createOpenAIClient()

  const result = await openAI.beta.chat.completions.parse({
    model: 'gpt-4o-2024-08-06',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful project manager.',
      },
      {
        role: 'user',
        content: `There are two tasks, TASK A and TASK B. Determine if the two tasks are wanting to do the same thing. Answer must be TRUE/FALSE only.
TASK A:
${taskA.name} - ${taskA.description}
TASK B:
${taskB.name} - ${taskB.description}
`,
      },
    ],
    response_format: zodResponseFormat(
      checkIsDuplicateResponse,
      'checkIsDuplicateResponse',
    ),
  })
  const output = result.choices[0].message
  if (!output?.parsed || output.refusal) {
    logger.debug('Check duplicate task: failed to parse output', {
      event: 'check_for_duplicate_task:failed_to_parse',
      ai_call: true,
      prompt,
      output_refusal: output.refusal,
      logData,
    })

    return false
  }

  logger.debug('Check duplicate task: got result', {
    event: 'check_for_duplicate_task:failed_to_parse',
    ai_call: true,
    prompt,
    logData,
    is_duplicate: output.parsed.is_duplicate,
  })

  return output.parsed.is_duplicate
}

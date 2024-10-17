import { logger } from '@/lib/log/logger'
import { taskPriority } from '@/lib/tasks/task-priority'
import { taskType } from '@/lib/tasks/task-type'
import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

interface ClassifyTaskParams {
  title: string
  description: string
  logData?: Record<string, any>
}

interface ClassifyTaskResult {
  task_type_id: number
  priority_level: number
}

const classifyTaskResponse = z.object({
  priority: z
    .union([
      z.literal('critical'),
      z.literal('high'),
      z.literal('medium'),
      z.literal('low'),
    ])
    .describe('Select one of the following that best describes the importance'),
  type: z
    .union([
      z.literal('feature'),
      z.literal('bug_fix'),
      z.literal('maintenance'),
      z.literal('planning'),
    ])
    .describe('Select one of the following that best describes the type'),
})

export async function classifyTask(
  params: ClassifyTaskParams,
): Promise<ClassifyTaskResult> {
  const { title, description, logData } = params

  const client = new OpenAI()

  const chatCompletion = await client.beta.chat.completions.parse({
    messages: [
      { role: 'system', content: 'You are an experienced software engineer.' },
      {
        role: 'user',
        content: `Classify the following task by assigning it to a type, and give it a priority. Follow the following rules:
- There will be a TITLE and DESCRIPTION.

TITLE:
${title}

DESCRIPTION:
${description}
`,
      },
    ],
    model: 'gpt-4o-2024-08-06',
    response_format: zodResponseFormat(
      classifyTaskResponse,
      'classifyTaskResponse',
    ),
  })

  const output = chatCompletion.choices[0].message
  if (!output?.parsed || output.refusal) {
    logger.debug('Classify task failed. Returning fallback classification.', {
      ai_call: true,
      event: 'classify_task:failed',
      title,
      description,
      output_missing: Boolean(output?.parsed),
      output_refusal: output.refusal,
      ...logData,
    })

    return {
      priority_level: taskPriority.medium,
      task_type_id: taskType.feature,
    }
  }

  logger.debug('Classified task', {
    ai_call: true,
    event: 'classify_task:success',
    title,
    description,
    result: output.parsed,
    ...logData,
  })

  return {
    priority_level: taskPriority[output.parsed.priority],
    task_type_id: taskType[output.parsed.type],
  }
}

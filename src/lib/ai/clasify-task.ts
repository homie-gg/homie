import { createOpenAIChatClient } from '@/lib/open-ai/create-open-ai-chat-client'
import { taskPriority } from '@/lib/tasks/task-priority'
import { taskType } from '@/lib/tasks/task-type'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { z } from 'zod'

interface ClassifyTaskParams {
  title: string
  description: string
}

interface ClassifyTaskResult {
  task_type_id: number
  priority_level: number
}

const resultParser = StructuredOutputParser.fromZodSchema(
  z.object({
    priority: z
      .union([
        z.literal('critical_bug'),
        z.literal('important'),
        z.literal('normal'),
        z.literal('nice_to_have'),
      ])
      .describe(
        'Select one of the following that best describes the importance',
      ),
    type: z
      .union([
        z.literal('feature'),
        z.literal('bug_fix'),
        z.literal('maintenance'),
        z.literal('planning'),
      ])
      .describe('Select one of the following that best describes the type'),
  }),
)

export async function classifyTask(
  params: ClassifyTaskParams,
): Promise<ClassifyTaskResult> {
  const { title, description } = params

  const model = createOpenAIChatClient({
    temperature: 0,
    modelName: 'gpt-4o',
  })

  const chatPrompt = ChatPromptTemplate.fromTemplate(prompt)

  const chain = RunnableSequence.from([chatPrompt, model, resultParser])

  const result = await chain.invoke({
    title,
    description,
    format_instructions: resultParser.getFormatInstructions(),
  })

  return {
    priority_level: taskPriority[result.priority],
    task_type_id: taskType[result.type],
  }
}

const prompt = `Classify the following task by assigning it to a type, and give it a priority. Follow the following rules:
- There will be a TITLE and DESCRIPTION.

TITLE:
{title}

DESCRIPTION:
{description}

{format_instructions}
`

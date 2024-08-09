import { logger } from '@/lib/log/logger'
import { createOpenAIChatClient } from '@/lib/open-ai/create-open-ai-chat-client'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'

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

export async function checkIsDuplicateTask(params: CheckIsTaskDuplicateParams) {
  const { taskA, taskB, logData } = params

  const prompt = `There are two tasks, TASK A and TASK B. Determine if the two tasks are wanting to do the same thing. Answer must be TRUE/FALSE only.
TASK A:
${taskA.name} - ${taskA.description}
TASK B:
${taskB.name} - ${taskB.description}
`

  const chatPrompt = ChatPromptTemplate.fromTemplate(prompt)

  const model = createOpenAIChatClient({
    temperature: 0,
    modelName: 'gpt-4o-2024-05-13',
  })
  const chain = RunnableSequence.from([
    chatPrompt,
    model,
    new StringOutputParser(),
  ])

  const answer = await chain.invoke({})

  logger.debug('AI: Check if duplicate task', {
    event: 'check_for_duplicate_task:ask_ai',
    ai_call: true,
    prompt,
    answer,
    is_duplicate: answer === 'TRUE',
    logData,
  })

  return answer === 'TRUE'
}

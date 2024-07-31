import { createOpenAIChatClient } from '@/lib/open-ai/create-open-ai-chat-client'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'

interface CheckIfTasksAreIdenticalParams {
  taskA: {
    name: string
    description: string
  }
  taskB: {
    name: string
    description: string
  }
}

export async function checkIfTasksAreIdentical(
  params: CheckIfTasksAreIdenticalParams,
) {
  const { taskA, taskB } = params

  const prompt = `Given the following two tasks, and descriptions, determine if they are identical. Answer must be TRUE/FALSE only.
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

  return answer === 'TRUE'
}

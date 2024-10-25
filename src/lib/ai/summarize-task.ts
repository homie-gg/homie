import { createOpenAIChatClient } from '@/lib/open-ai/create-open-ai-chat-client'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { z } from 'zod'

interface SummarizeTaskParams {
  messages: Array<{ text: string }>
}

interface SummarizeTaskResult {
  task: string
  requirements: string
}

const parser = StructuredOutputParser.fromZodSchema(
  z.object({
    task: z.string().describe('The task to complete'),
    requirements: z.string().describe('Task requirements in a markdown list'),
  }),
)

export async function summarizeTask(
  params: SummarizeTaskParams,
): Promise<SummarizeTaskResult> {
  const { messages } = params

  const model = createOpenAIChatClient({
    temperature: 0,
    modelName: 'gpt-4o-2024-05-13',
  })

  const chatPrompt = ChatPromptTemplate.fromTemplate(prompt)

  const chain = RunnableSequence.from([chatPrompt, model, parser])

  return chain.invoke({
    context: JSON.stringify(messages),
    format_instructions: parser.getFormatInstructions(),
  })
}

const prompt = `Identify, and summarize a single Task that needs to be done from the context below. You should follow ALL of the following rules when generating an answer:
- There will be a CONTEXT.
- The context is a set of JSON objects, each object includes a "text" property that is chat message that was sent.
- The chat messages are in order with latest messages first.
- Stop looking for other tasks once you have identified one.
- Ignore any chat messages that are not relevant to the identified task.
- Each Task should describe the issue, and the requirement.
- Do not make up any information if the CONTEXT does not have relevant information.
- Use bullet points, lists, paragraphs and text styling to present the task summary in markdown.
- The answer should only be based on the CONTEXT. Do not use any external sources. Do not generate the response based on the question without clear reference to the context.
- Summarize the CONTEXT to make it easier to read, but don't omit any information.
- The summary should contain the following headings: Task, Requirements.
- Each point should be less than 10 words.

{format_instructions}

CONTEXT: {context}
`

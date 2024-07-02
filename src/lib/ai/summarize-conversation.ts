import { createOpenAIChatClient } from '@/lib/open-ai/create-open-ai-chat-client'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'

interface SummarizeConversationParams {
  messages: Array<{ text: string }>
}

export async function summarizeConversation(
  params: SummarizeConversationParams,
) {
  const { messages } = params

  const model = createOpenAIChatClient({
    temperature: 0,
    modelName: 'gpt-4o-2024-05-13',
  })
  const chatPrompt = ChatPromptTemplate.fromTemplate(prompt)
  const parser = new StringOutputParser()
  const chain = RunnableSequence.from([chatPrompt, model, parser])

  return chain.invoke({ context: JSON.stringify(messages) })
}

const prompt = `Summarize the following conversation in the CONTEXT> You should follow ALL of the following rules when generating an answer:
- There will be a CONTEXT.
- The context is a set of JSON objects, each object includes a "text" property that is chat message that was sent.
- The chat messages are in order with latest messages first.
- Do not make up any information if the CONTEXT does not have relevant information.
- Use bullet points, lists, paragraphs and text styling to present the task summary in markdown.
- The answer should only be based on the CONTEXT. Do not use any external sources. Do not generate the response based on the question without clear reference to the context.
- Summarize the CONTEXT to make it easier to read, but don't omit any information.
- Each point should be less than 10 words.

CONTEXT: {context}
`

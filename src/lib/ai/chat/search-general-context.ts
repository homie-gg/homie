import { getGeneralContext } from '@/lib/ai/chat/get-general-context'
import { createOpenAIChatClient } from '@/lib/open-ai/create-open-ai-chat-client'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'

interface SearchGeneralContextParams {
  question: string
  organization: {
    id: number
  }
}

export async function searchGeneralContext(
  params: SearchGeneralContextParams,
): Promise<string> {
  const { question, organization } = params

  const context = await getGeneralContext({
    organization,
    question,
  })

  const model = createOpenAIChatClient({
    temperature: 0,
    model: 'gpt-4o-2024-05-13',
  })

  const chatPrompt = ChatPromptTemplate.fromTemplate(prompt)

  const parser = new StringOutputParser()
  const chain = RunnableSequence.from([chatPrompt, model, parser])

  return chain.invoke({
    question,
    context,
  })
}

const prompt = `Answer the question based on the context below. You should follow ALL the following rules when generating and answer:
- There will be a CONTEXT, and a QUESTION.
- The CONTEXT is a JSON object that contains data you should use to answer the QUESTION.
- Your goal is to provide the user with an answer that is relevant to the question.
- Provide the user with a code example that is relevant to the question, if the context contains relevant code examples. Do not make up any code examples on your own.
- Do not make up any answers if the CONTEXT does not have relevant information.
- Do not mention the CONTEXT in the answer, but use them to generate the answer.
- The answer should only be based on the CONTEXT. Do not use any external sources. Do not generate the response based on the question without clear reference to the context.
- Summarize the answer to make it easier to read, but don't omit any information.
- Answer in a concise manner, and limit prose.
- If the answer mentions a Pull Request, include the Pull Request title, and url.

QUESTION:
{question}

CONTEXT:
{context}

Final Answer:`

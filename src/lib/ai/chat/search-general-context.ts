import { getGeneralContext } from '@/lib/ai/chat/get-general-context'
import { createOpenAIChatClient } from '@/lib/open-ai/create-open-ai-chat-client'
import { createOpenAIClient } from '@/lib/open-ai/create-open-ai-client'
import { PromptTemplate } from '@langchain/core/prompts'

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

  const promptTemplate = new PromptTemplate({
    template: prompt,
    inputVariables: ['question', 'context'],
  })

  const input = await promptTemplate.format({
    question,
    context,
  })

  const model = createOpenAIChatClient({
    temperature: 0,
    model: 'gpt-4o',
  })

  return (await model.invoke(input)).content as string
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

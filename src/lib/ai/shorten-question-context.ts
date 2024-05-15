import { PromptTemplate } from '@langchain/core/prompts'
import { OpenAI } from '@langchain/openai'

interface ShortenQuestionContextParams {
  question: string
  context: string
  promptLength: number
}

export const chatGPTCharLimit = 4000

export async function shortenQuestionContext(
  params: ShortenQuestionContextParams,
): Promise<string> {
  const { question, context, promptLength } = params

  // If we're under the limit, no need to shorten
  if (question.length + context.length + promptLength < chatGPTCharLimit) {
    return context
  }

  const chunks = getChunks(context)

  const shortenedChunks = await Promise.all(
    chunks.map(async (chunk) =>
      summarize({
        context: chunk,
        question: question,
        promptLength,
      }),
    ),
  )

  const result = shortenedChunks.join('\n')

  // If we're still over the limit, we'll re-summarize
  if (question.length + result.length + promptLength > chatGPTCharLimit) {
    return shortenQuestionContext({
      context: result,
      question: question,
      promptLength,
    })
  }

  return result
}

function getChunks(context: string): string[] {
  return context.split('\n').reduce((acc, point) => {
    const lastIndex = acc.length - 1
    const lastItem = acc[lastIndex] ?? ''

    const appended = lastItem + '\n' + point
    if (appended.length > 4000) {
      return [...acc, point]
    }

    return [...acc.slice(0, lastIndex), appended]
  }, [] as string[])
}

async function summarize(params: ShortenQuestionContextParams) {
  const { context, question } = params
  const promptTemplate = new PromptTemplate({
    template: prompt,
    inputVariables: ['question', 'context'],
  })

  const input = await promptTemplate.format({
    context,
    question,
  })

  const model = new OpenAI({ temperature: 0, modelName: 'gpt-4o' })

  return model.invoke(input)
}

const prompt = `Shorten the CONTEXT to answer the QUESTION. You must follow the following rules:
- If the point is not relevant to the question DO NOT include it in your answer.
- Your answer MUST be in bullet points.
- Any code found in the CONTEXT should ALWAYS be preserved in the summary, unchanged.
- DO NOT make up information, only use what is in the CONTEXT.

QUESTION:
{question}

CONTEXT: 
{context}
`

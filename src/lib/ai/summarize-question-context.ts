import { PromptTemplate } from '@langchain/core/prompts'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { OpenAI } from '@langchain/openai'

interface SummarizeQuestionContextParams {
  question: string
  context: string
}

export const chatGPTCharLimit = 4000

export async function summarizeQuestionContext(
  params: SummarizeQuestionContextParams,
): Promise<string> {
  const { question, context } = params

  // Chunk document into limit character chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: chatGPTCharLimit - prompt.length - 1,
    chunkOverlap: 1,
  })

  const chunks = await splitter.createDocuments([context])

  const summarizedChunks = await Promise.all(
    chunks.map(async (chunk) => {
      return await summarize({
        context: chunk.pageContent,
        question: question,
      })
    }),
  )

  const result = summarizedChunks.join('\n')

  // If we're still over the limit, we'll re-summarize
  if (result.length + prompt.length > chatGPTCharLimit) {
    return await summarizeQuestionContext({
      context: result,
      question: question,
    })
  }

  return result
}

async function summarize(params: SummarizeQuestionContextParams) {
  const { context, question } = params
  const promptTemplate = new PromptTemplate({
    template: prompt,
    inputVariables: ['question', 'context'],
  })

  const input = await promptTemplate.format({
    context,
    question,
  })

  const model = new OpenAI({ temperature: 0, modelName: 'gpt-3.5-turbo' })

  return model.invoke(input)
}

const prompt = `Shorten the text in the CONTEXT, attempting to answer the QUESTION You should follow the following rules when generating the summary:
- Any code found in the CONTEXT should ALWAYS be preserved in the summary, unchanged.
- Code will be surrounded by backticks (\`) or triple backticks (\`\`\`).
- Summary should include code examples that are relevant to the QUESTION, based on the content. Do not make up any code examples on your own.
- The summary will answer the QUESTION. If it cannot be answered, the summary should be empty, AND NO TEXT SHOULD BE RETURNED IN THE FINAL ANSWER AT ALL.
- If the QUESTION cannot be answered, the final answer should be empty.
- The summary should be under 4000 characters.
- The summary should be 2000 characters long, if possible.

QUESTION: {question}
CONTEXT: {context}

Final answer:
`

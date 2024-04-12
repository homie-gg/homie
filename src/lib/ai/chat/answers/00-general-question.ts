import { getEmbeddingMatches } from '@/lib/ai/get-embedding-matches'
import {
  chatGPTCharLimit,
  shortenQuestionContext,
} from '@/lib/ai/shorten-question-context'
import { CohereClient } from 'cohere-ai'
import { OpenAI, OpenAIEmbeddings } from '@langchain/openai'

import { PromptTemplate } from '@langchain/core/prompts'
import { logger } from '@/lib/log/logger'

interface AnswerGeneralQuestionParams {
  question: string
  organizationId: number
}

export async function answerGeneralQuestion(
  params: AnswerGeneralQuestionParams,
): Promise<string> {
  const { question, organizationId } = params

  const embedder = new OpenAIEmbeddings({
    modelName: 'text-embedding-3-large',
  })

  // 1. Turn question into a vector

  const embeddings = await embedder.embedQuery(question)

  // 2. Find 'answers' which are really just similar vectors

  const { matches } = await getEmbeddingMatches({
    embeddings,
    numTopResults: 30, // fetch lots of results, but we'll re-rank and take top x
    organizationId,
  })

  if (matches.length === 0) {
    return "We don't have an answer for that yet."
  }

  // 3. re-rank to find relevant results

  const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY,
  })

  const reranked = await cohere.rerank({
    query: question,
    documents: matches.map((match) => (match.metadata?.text ?? '') as string),
  })

  const rankedDocuments = reranked.results
    .map((result) => matches[result.index].metadata?.text as string)
    .filter((text) => !!text) // remove empty text
    .slice(0, 3) // only use top docs for relevancy

  // 4. summarize context to fit length

  const context = await getContext(question, rankedDocuments)

  // 5. Get answer

  const model = new OpenAI({ temperature: 0, modelName: 'gpt-4' })

  const promptTemplate = new PromptTemplate({
    template: prompt,
    inputVariables: ['question', 'context'],
  })

  const input = await promptTemplate.format({
    question,
    context,
  })

  const answer = await model.invoke(input)

  logger.debug('Answered general question', {
    event: 'answer_general_question',
    question,
    matches: matches.map((match) => match.metadata?.text),
    reranked: rankedDocuments,
    context,
    answer,
    organization: {
      id: organizationId,
    },
  })

  return answer
}

async function getContext(question: string, documents: string[]) {
  const context = documents.join('\n')

  // If we're under the limit, no need to shorten
  if (question.length + context.length + prompt.length < chatGPTCharLimit) {
    return context
  }

  return shortenQuestionContext({
    question,
    context,
    promptLength: prompt.length,
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

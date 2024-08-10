import { getEmbeddingMatches } from '@/lib/ai/get-embedding-matches'
import {
  contextCharacterLimit,
  shortenQuestionContext,
} from '@/lib/ai/shorten-question-context'
import { CohereClient } from 'cohere-ai'
import { createOpenAIClient } from '@/lib/open-ai/create-open-ai-client'

interface GetGeneralContext {
  question: string
  organization: {
    id: number
  }
}

export async function getGeneralContext(
  params: GetGeneralContext,
): Promise<string> {
  const { question, organization } = params

  // 1. Turn question into a vector

  const openAI = createOpenAIClient()
  const embeddings = (
    await openAI.embeddings.create({
      model: 'text-embedding-3-large',
      input: question,
    })
  ).data[0].embedding

  // 2. Find 'answers' which are really just similar vectors

  const { matches } = await getEmbeddingMatches({
    embeddings,
    numTopResults: 30, // fetch lots of results, but we'll re-rank and take top x
    organizationId: organization.id,
  })

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

  return await getShortenedContext(question, rankedDocuments)
}

async function getShortenedContext(question: string, documents: string[]) {
  const context = documents.join('\n')

  // If we're under the limit, no need to shorten
  if (question.length + context.length < contextCharacterLimit) {
    return context
  }

  return shortenQuestionContext({
    question,
    context,
  })
}

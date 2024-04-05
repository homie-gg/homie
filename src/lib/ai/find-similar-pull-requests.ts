import { getEmbeddingMatches } from '@/lib/ai/get-embedding-matches'
import { OpenAIEmbeddings } from '@langchain/openai'

interface FindSimilarPullRequestsParams {
  diffSummary: string
  organizationId: number
}

export async function findSimilarPullRequests(
  params: FindSimilarPullRequestsParams,
) {
  const { diffSummary, organizationId } = params

  const embedder = new OpenAIEmbeddings({
    modelName: 'text-embedding-3-large',
  })

  const findSimilarPullRequestsQuery = `Find similar pull requests that have made changes to the same parts of the application as the following pull request summary: ${diffSummary}`

  const embeddings = await embedder.embedQuery(findSimilarPullRequestsQuery)

  const { matches } = await getEmbeddingMatches({
    embeddings,
    numTopResults: 10,
    organizationId,
  })

  return matches
}

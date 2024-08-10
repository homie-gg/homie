import { getEmbeddingMatches } from '@/lib/ai/get-embedding-matches'
import { createOpenAIClient } from '@/lib/open-ai/create-open-ai-client'

interface FindSimilarPullRequestsParams {
  diffSummary: string
  organizationId: number
}

export async function findSimilarPullRequests(
  params: FindSimilarPullRequestsParams,
) {
  const { diffSummary, organizationId } = params

  const findSimilarPullRequestsQuery = `Find similar pull requests that have made changes to the same parts of the application as the following pull request summary: ${diffSummary}`

  const openAI = createOpenAIClient()
  const embeddings = (
    await openAI.embeddings.create({
      model: 'text-embedding-3-large',
      input: findSimilarPullRequestsQuery,
    })
  ).data[0].embedding

  const { matches } = await getEmbeddingMatches({
    embeddings: embeddings,
    numTopResults: 10,
    organizationId,
  })

  return matches
}

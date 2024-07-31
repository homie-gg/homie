import { getOrganizationVectorDB } from '@/lib/ai/get-organization-vector-db'

interface GetEmbeddingMatchesParams {
  embeddings: number[]
  numTopResults: number
  organizationId: number
}

export async function getEmbeddingMatches(params: GetEmbeddingMatchesParams) {
  const { embeddings, numTopResults, organizationId } = params

  const vectorDB = getOrganizationVectorDB(organizationId)

  try {
    const result = await vectorDB.query({
      vector: embeddings,
      topK: numTopResults,
      includeMetadata: true,
      filter: {
        organization_id: {
          $eq: organizationId,
        },
      },
    })

    return result
  } catch (e) {
    throw new Error(`Error querying embeddings: ${e}`)
  }
}

import { pineconeClient } from '@/lib/pinecone/create-pinecone-client'

interface GetEmbeddingMatchesParams {
  embeddings: number[]
  numTopResults: number
  organizationId: number
}

export async function getEmbeddingMatches(params: GetEmbeddingMatchesParams) {
  const { embeddings, numTopResults, organizationId } = params

  const index = pineconeClient.Index(process.env.PINECONE_INDEX_MAIN!)

  try {
    const result = await index.query({
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

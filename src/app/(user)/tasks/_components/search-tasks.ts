import { TaskMetadata } from '@/lib/ai/embed-task'
import { getOrganizationVectorDB } from '@/lib/ai/get-organization-vector-db'
import { createOpenAIEmbedder } from '@/lib/open-ai/create-open-ai-embedder'
import { CohereClient } from 'cohere-ai'

interface SearchTasksParams {
  searchTerm?: string
  organization: {
    id: number
  }
}

export async function searchTasks(params: SearchTasksParams) {
  const { searchTerm, organization } = params

  if (!searchTerm) {
    return
  }

  const embedder = createOpenAIEmbedder({
    modelName: 'text-embedding-3-large',
  })
  const embeddings = await embedder.embedQuery(searchTerm)

  const pineconeSearchFilters: Record<string, any> = {
    organization_id: {
      $eq: organization.id,
    },
    type: {
      $eq: 'task',
    },
  }

  const vectorDB = getOrganizationVectorDB(organization.id)

  const { matches } = await vectorDB.query({
    vector: embeddings,
    topK: 30,
    includeMetadata: true,
    filter: pineconeSearchFilters,
  })

  const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY,
  })

  const reranked = await cohere.rerank({
    query: searchTerm,
    documents: matches.map((match) => (match.metadata?.text ?? '') as string),
  })

  return reranked.results
    .filter((result) => result.relevanceScore > 0.6)
    .map((result) => {
      const metadata = matches[result.index].metadata as unknown as TaskMetadata

      return metadata.task_id
    })
}

import { getOrganizationVectorDB } from '@/lib/ai/get-organization-vector-db'
import { OpenAIEmbeddings } from '@langchain/openai'
import { CohereClient } from 'cohere-ai'

interface GetWriteCodeContextParams {
  instructions: string
  github_repo_id?: number
  gitlab_project_id?: number
  organization_id: number
}

const contextRelevanceScoreThreshold = 0.6

export async function getWriteCodeContext(
  params: GetWriteCodeContextParams,
): Promise<string | null> {
  const { instructions, organization_id, github_repo_id, gitlab_project_id } =
    params

  const embedder = new OpenAIEmbeddings({
    modelName: 'text-embedding-3-large',
  })

  const embeddings = await embedder.embedQuery(instructions)

  const vectorDB = getOrganizationVectorDB(organization_id)

  const filter: Record<string, any> = {
    organization_id: {
      $eq: organization_id,
    },
    type: {
      $eq: 'pull_request_diff',
    },
  }

  if (github_repo_id) {
    filter['github_repo_id'] = {
      $eq: github_repo_id,
    }
  }

  if (gitlab_project_id) {
    filter['gitlab_project_id'] = {
      $eq: gitlab_project_id,
    }
  }

  const { matches } = await vectorDB.query({
    vector: embeddings,
    topK: 100, // fetch lots of results, but we'll re-rank and take top x
    includeMetadata: true,
    filter: {
      organization_id: {
        $eq: organization_id,
      },
      type: {
        $in: ['pull_request_diff', 'pull_request_change', 'conversation'],
      },
    },
  })

  const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY,
  })

  const reranked = await cohere.rerank({
    query: instructions,
    documents: matches.map((match) => (match.metadata?.text ?? '') as string),
  })

  const documents = reranked.results
    .filter((result) => {
      const isRelevant = result.relevanceScore > contextRelevanceScoreThreshold
      const content = matches[result.index].metadata?.text

      return isRelevant && Boolean(content)
    })
    .map((result) => matches[result.index].metadata?.text as string)
    .slice(0, 10)

  if (documents.length === 0) {
    return null
  }

  return documents.join('\n')
}

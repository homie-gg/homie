import { dbClient } from '@/database/client'
import { createOpenAIEmbedder } from '@/lib/open-ai/create-open-ai-embedder'
import { getPineconeClient } from '@/lib/pinecone/pinecone-client'
import { CohereClient } from 'cohere-ai'

interface FindTaskParams {
  organization_id: number
  name?: string
  id?: number
}

type FindTaskResult =
  | {
      id: number
      name: string
      html_url: string
      description: string
    }
  | null
  | undefined

export async function findTask(
  params: FindTaskParams,
): Promise<FindTaskResult> {
  const { organization_id, id, name } = params

  if (id) {
    return dbClient
      .selectFrom('homie.task')
      .where('homie.task.id', '=', id)
      .where('homie.task.organization_id', '=', organization_id)
      .select(['id', 'name', 'html_url', 'description'])
      .executeTakeFirst()
  }

  if (name) {
    const query = `Task: ${name}`
    const embedder = createOpenAIEmbedder({
      modelName: 'text-embedding-3-large',
    })
    const embeddings = await embedder.embedQuery(query)
    const index = getPineconeClient().Index(process.env.PINECONE_INDEX_MAIN!)

    const { matches } = await index.query({
      vector: embeddings,
      topK: 10,
      includeMetadata: true,
      filter: {
        organization_id: {
          $eq: organization_id,
        },
        type: {
          $eq: 'task',
        },
      },
    })

    const cohere = new CohereClient({
      token: process.env.COHERE_API_KEY,
    })

    const reranked = await cohere.rerank({
      query,
      documents: matches.map((match) => (match.metadata?.text ?? '') as string),
    })

    if (reranked.results.length === 0) {
      return null
    }

    const topResult = reranked.results[0]
    const taskId = matches[topResult.index].metadata?.task_id

    if (!taskId) {
      return null
    }

    const id = typeof taskId === 'number' ? taskId : parseInt(taskId.toString())

    return dbClient
      .selectFrom('homie.task')
      .where('homie.task.id', '=', id)
      .where('homie.task.organization_id', '=', organization_id)
      .select(['id', 'name', 'html_url', 'description'])
      .executeTakeFirst()
  }

  return null
}

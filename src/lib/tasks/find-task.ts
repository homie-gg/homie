import { dbClient } from '@/database/client'
import { getOrganizationVectorDB } from '@/lib/ai/get-organization-vector-db'
import { createOpenAIClient } from '@/lib/open-ai/create-open-ai-client'
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
    const openAI = createOpenAIClient()
    const embeddings = (
      await openAI.embeddings.create({
        model: 'text-embedding-3-large',
        input: query,
      })
    ).data[0].embedding

    const vectorDB = getOrganizationVectorDB(organization_id)
    const { matches } = await vectorDB.query({
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

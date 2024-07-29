import { dbClient } from '@/database/client'
import { TaskMetadata } from '@/lib/ai/embed-task'
import { createOpenAIEmbedder } from '@/lib/open-ai/create-open-ai-embedder'
import { getPineconeClient } from '@/lib/pinecone/pinecone-client'
import { CheckForDuplicateTask } from '@/queue/jobs'
import { CohereClient } from 'cohere-ai'

/**
 * Cohere relevance score. If a task relevance score is above this, then it is
 * considered to potentially be a duplicate.
 */
const duplicateTaskRelevanceScoreThreshold = 0.7

export async function handleCheckForDuplicateTask(job: CheckForDuplicateTask) {
  const { task } = job.data

  const searchTerm = `${task.name}\n${task.description}`

  const embedder = createOpenAIEmbedder({
    modelName: 'text-embedding-3-large',
  })

  const embeddings = await embedder.embedQuery(searchTerm)

  const pineconeSearchFilters: Record<string, any> = {
    organization_id: {
      $eq: task.organization_id,
    },
    type: {
      $eq: 'task',
    },
    task_id: {
      $ne: task.id, // Don't match THIS task (or it will be a duplicate)
    },
  }

  const index = getPineconeClient().Index(process.env.PINECONE_INDEX_MAIN!)

  const { matches } = await index.query({
    vector: embeddings,
    topK: 10,
    includeMetadata: true,
    filter: pineconeSearchFilters,
  })

  if (matches.length === 0) {
    // No matching duplicate task
    return
  }

  const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY,
  })

  const reranked = await cohere.rerank({
    query: searchTerm,
    documents: matches.map((match) => (match.metadata?.text ?? '') as string),
  })

  const rankedDocuments = reranked.results
    .filter(
      (result) => result.relevanceScore > duplicateTaskRelevanceScoreThreshold,
    )
    .map((result) => matches[result.index].metadata as unknown as TaskMetadata)

  // No ranked results above minimum relevant score
  if (rankedDocuments.length === 0) {
    return
  }

  const duplicateTaskId = rankedDocuments[0].task_id

  const duplicateTask = await dbClient
    .selectFrom('homie.task')
    .where('organization_id', '=', task.organization_id)
    .where('homie.task.id', '=', duplicateTaskId)
    .executeTakeFirst()

  if (!duplicateTask) {
    return
  }

  // send github comment
  // send asana comment
  // send trello comment

  // TODO:
  // - Found duplicate task, send comments....
  // - add logging
}

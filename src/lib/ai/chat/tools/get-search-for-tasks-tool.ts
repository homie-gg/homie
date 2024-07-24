import { TaskMetadata } from '@/lib/ai/embed-task'
import { logger } from '@/lib/log/logger'
import { createOpenAIEmbedder } from '@/lib/open-ai/create-open-ai-embedder'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { getPineconeClient } from '@/lib/pinecone/pinecone-client'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { CohereClient } from 'cohere-ai'
import { parseISO } from 'date-fns'
import { z } from 'zod'

interface GetSearchForTasksToolParams {
  organization: {
    id: number
    ext_gh_install_id: number | null
  }
  answerId: string
}

const numResults = 30

/**
 * Cohere relevance score to be included as results.
 * Value from 0 - 1 (1 is most relevant)
 * Reference: https://docs.cohere.com/docs/reranking-best-practices#interpreting-results
 */
const searchRelevanceThreshold = 0.4

export function getSearchForTasksTool(params: GetSearchForTasksToolParams) {
  const { organization, answerId } = params

  return new DynamicStructuredTool({
    name: 'search_for_tasks',
    description: 'Search for tasks related to a given search term',
    schema: z.object({
      searchTerm: z.string().describe('Term the task is related to'),
      includeCompletedTasks: z
        .boolean()
        .default(false)
        .describe('Whether to only include done tasks'),
      type: z
        .enum(['feature', 'bug_fix', 'maintenance', 'planning'])
        .describe('What kind of task to search for')
        .optional(),
    }),
    func: async (params) => {
      const { searchTerm, includeCompletedTasks, type } = params

      logger.debug('Call - Search for tasks', {
        event: 'get_answer:search_tasks:call',
        answer_id: answerId,
        organization: getOrganizationLogData(organization),
        search_term: searchTerm,
      })

      try {
        const embedder = createOpenAIEmbedder({
          modelName: 'text-embedding-3-large',
        })
        const embeddings = await embedder.embedQuery(searchTerm)
        const index = getPineconeClient().Index(
          process.env.PINECONE_INDEX_MAIN!,
        )

        const pineconeSearchFilters: Record<string, any> = {
          organization_id: {
            $eq: organization.id,
          },
          type: {
            $eq: 'task',
          },
        }

        if (!includeCompletedTasks) {
          pineconeSearchFilters['task_status'] = {
            $eq: 'open',
          }
        }

        if (type) {
          pineconeSearchFilters['task_type'] = {
            $eq: type,
          }
        }

        const { matches } = await index.query({
          vector: embeddings,
          topK: numResults,
          includeMetadata: true,
          filter: pineconeSearchFilters,
        })

        if (matches.length === 0) {
          return 'No tasks found'
        }

        const cohere = new CohereClient({
          token: process.env.COHERE_API_KEY,
        })

        const reranked = await cohere.rerank({
          query: searchTerm,
          documents: matches.map(
            (match) => (match.metadata?.text ?? '') as string,
          ),
        })

        const rankedDocuments = reranked.results
          .filter((result) => result.relevanceScore > searchRelevanceThreshold)
          .map(
            (result) =>
              matches[result.index].metadata as unknown as TaskMetadata,
          )
          .sort((aTask, bTask) => {
            // Always return higher priority first
            if (aTask.priority_level < bTask.priority_level) {
              return -1
            }

            if (aTask.priority_level > bTask.priority_level) {
              return 1
            }

            const aDueDate = aTask.due_date
              ? parseISO(aTask.due_date).valueOf()
              : null
            const bDueDate = bTask.due_date
              ? parseISO(bTask.due_date).valueOf()
              : null

            // If there is a due date, return those due soonest (smallest values) first
            if (aDueDate && bDueDate) {
              return aDueDate - bDueDate
            }

            if (aDueDate && !bDueDate) {
              return -1
            }

            if (!aDueDate && bDueDate) {
              return 1
            }

            // Otherwise, return created at descending (newest first)

            const aCreatedAt = parseISO(aTask.created_at).valueOf()
            const bCreatedAt = parseISO(bTask.created_at).valueOf()

            return bCreatedAt - aCreatedAt
          })

        return JSON.stringify(rankedDocuments)
      } catch (error) {
        logger.debug('Failed to search for tasks', {
          event: 'get_answer:search_tasks:task',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          search_term: searchTerm,
          error: error instanceof Error ? error.message : error,
        })

        return 'FAILED'
      }
    },
  })
}

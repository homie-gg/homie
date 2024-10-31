import { TaskMetadata } from '@/lib/ai/embed-task'
import { logger } from '@/lib/log/logger'
import { createOpenAIEmbedder } from '@/lib/open-ai/create-open-ai-embedder'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { CohereClient } from 'cohere-ai'
import { parseISO } from 'date-fns'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { getOrganizationVectorDB } from '@/lib/ai/get-organization-vector-db'

interface GetSearchForTasksToolParams {
  organization: {
    id: number
    ext_gh_install_id: number | null
  }
  answerID: string
}

const numResults = 30

/**
 * Cohere relevance score to be included as results.
 * Value from 0 - 1 (1 is most relevant)
 * Reference: https://docs.cohere.com/docs/reranking-best-practices#interpreting-results
 */
const searchRelevanceThreshold = 0.4

export function getSearchForTasksTool(params: GetSearchForTasksToolParams) {
  const { organization, answerID: answerId } = params

  return new DynamicStructuredTool({
    name: 'search_for_tasks',
    description:
      'Search for tasks related to a given search term. Use this when the question is specifically about finding tasks.',
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
        include_completed_tasks: includeCompletedTasks,
        type,
      })

      try {
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

        const vectorDB = getOrganizationVectorDB(organization.id)

        const { matches } = await vectorDB.query({
          vector: embeddings,
          topK: numResults,
          includeMetadata: true,
          filter: pineconeSearchFilters,
        })

        if (matches.length === 0) {
          logger.debug('No matches', {
            event: 'get_answer:search_tasks:no_matches',
            answer_id: answerId,
            organization: getOrganizationLogData(organization),
            search_term: searchTerm,
            include_completed_tasks: includeCompletedTasks,
            type,
            filters: pineconeSearchFilters,
          })

          return 'No tasks found'
        }

        logger.debug('Got matches', {
          event: 'get_answer:search_tasks:found_matches',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          search_term: searchTerm,
          matches,
          include_completed_tasks: includeCompletedTasks,
          type,
          filters: pineconeSearchFilters,
        })

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

            const aCreatedAt = aTask.created_at
              ? parseISO(aTask.created_at).valueOf()
              : 0
            const bCreatedAt = bTask.created_at
              ? parseISO(bTask.created_at).valueOf()
              : 0

            return bCreatedAt - aCreatedAt
          })

        logger.debug('Ranked and filtered results', {
          event: 'get_answer:search_tasks:ranked_results',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          search_term: searchTerm,
          matches,
          reranked_raw: reranked.results.map((result) => {
            const metadata = matches[result.index]
              .metadata as unknown as TaskMetadata
            return { name: metadata.text, id: metadata.task_id }
          }),
          search_relevance_threshold: searchRelevanceThreshold,
          result: rankedDocuments,
          include_completed_tasks: includeCompletedTasks,
          type,
          filters: pineconeSearchFilters,
        })

        const tasks = rankedDocuments.map((taskMetadata) => ({
          id: taskMetadata.task_id,
          name: taskMetadata.name,
          description: taskMetadata.description,
          url: taskMetadata.html_url,
        }))

        return JSON.stringify(tasks)
      } catch (error) {
        Sentry.captureException(error)

        logger.debug('Failed to search for tasks', {
          event: 'get_answer:search_tasks:failed',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          search_term: searchTerm,
          error: error instanceof Error ? error.message : error,
          stack_trace: error instanceof Error ? error.stack?.split('\n') : null,
          include_completed_tasks: includeCompletedTasks,
          type,
        })

        return 'FAILED'
      }
    },
  })
}

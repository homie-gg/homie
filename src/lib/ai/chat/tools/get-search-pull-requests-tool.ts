import { TaskMetadata } from '@/lib/ai/embed-task'
import { logger } from '@/lib/log/logger'
import { createOpenAIEmbedder } from '@/lib/open-ai/create-open-ai-embedder'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { getPineconeClient } from '@/lib/pinecone/pinecone-client'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { CohereClient } from 'cohere-ai'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'

interface GetSearchPullRequestsToolParams {
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

export function getSearchPullRequestsTool(
  params: GetSearchPullRequestsToolParams,
) {
  const { organization, answerId } = params

  return new DynamicStructuredTool({
    name: 'search_for_pull_requests',
    description: 'Search for Pull Requests',
    schema: z.object({
      searchTerm: z.string().describe('Term the pull request is related to'),
    }),
    func: async (params) => {
      const { searchTerm } = params

      logger.debug('Call - Search for pull requests', {
        event: 'get_answer:search_pull_requests:call',
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
            $in: ['pr_summary', 'pr_diff', 'mr_summary', 'mr_diff'],
          },
        }

        const { matches } = await index.query({
          vector: embeddings,
          topK: numResults,
          includeMetadata: true,
          filter: pineconeSearchFilters,
        })

        if (matches.length === 0) {
          logger.debug('No matching pull requests', {
            event: 'get_answer:search_pull_requests:no_matches',
            answer_id: answerId,
            organization: getOrganizationLogData(organization),
            search_term: searchTerm,
          })

          return 'No pull requests found'
        }

        logger.debug('Got matches', {
          event: 'get_answer:search_pull_requests:found_matches',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          search_term: searchTerm,
          matches,
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

        const rankedDocuments = reranked.results.filter(
          (result) => result.relevanceScore > searchRelevanceThreshold,
        )

        logger.debug('Ranked and filtered results', {
          event: 'get_answer:search_pull_requests:ranked_results',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          search_term: searchTerm,
          matches,
          reranked_raw: reranked.results.map(
            (result) =>
              matches[result.index].metadata as unknown as TaskMetadata,
          ),
          search_relevance_threshold: searchRelevanceThreshold,
          result: rankedDocuments,
          filters: pineconeSearchFilters,
        })

        return JSON.stringify(rankedDocuments)
      } catch (error) {
        Sentry.captureException(error)

        logger.debug('Failed to search for tasks', {
          event: 'get_answer:search_pull_requests:failed',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          search_term: searchTerm,
          error: error instanceof Error ? error.message : error,
          stack_trace: error instanceof Error ? error.stack?.split('\n') : null,
        })

        return 'FAILED'
      }
    },
  })
}
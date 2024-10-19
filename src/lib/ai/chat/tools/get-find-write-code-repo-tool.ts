import { dbClient } from '@/database/client'
import { PullRequestChangeMetadata } from '@/lib/ai/embed-pull-request-changes'
import { getOrganizationVectorDB } from '@/lib/ai/get-organization-vector-db'
import { logger } from '@/lib/log/logger'
import { createOpenAIEmbedder } from '@/lib/open-ai/create-open-ai-embedder'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { CohereClient } from 'cohere-ai'
import { z } from 'zod'

interface GetFindWriteCodeRepoToolParams {
  organization: {
    id: number
    ext_gh_install_id: number | null
    gitlab_access_token: string | null
    slack_access_token: string
  }
  answerID: string
}

export function getFindWriteCodeRepoTool(
  params: GetFindWriteCodeRepoToolParams,
) {
  const { organization, answerID } = params

  return new DynamicStructuredTool({
    name: 'find_write_code_repo',
    description:
      'Find the Github Repository or Gitlab Project to write the code for',
    schema: z.object({
      requirements: z
        .string()
        .describe(
          'Requirements that describe the bug fix or feature that the code should do.',
        ),
    }),
    func: async (params) => {
      const { requirements } = params

      logger.debug('Try to find matching repo to write code in', {
        event: 'find_write_code_repo:start',
        answer_id: answerID,
        organization: getOrganizationLogData(organization),
        requirements,
      })

      const embedder = createOpenAIEmbedder({
        modelName: 'text-embedding-3-large',
      })
      const embeddings = await embedder.embedQuery(requirements)
      const vectorDB = getOrganizationVectorDB(organization.id)

      const { matches } = await vectorDB.query({
        vector: embeddings,
        topK: 20,
        includeMetadata: true,
        filter: {
          organization_id: {
            $eq: organization.id,
          },
          type: {
            $eq: 'pull_request_change',
          },
        },
      })

      if (matches.length === 0) {
        logger.debug('Missing matches', {
          event: 'find_write_code_repo:missing_matches',
          answer_id: answerID,
          organization: getOrganizationLogData(organization),
          requirements,
        })

        return `Could not find a matching repo. Try calling 'list_github_repos' or 'list_gitlab_projects' tool and selecting one from there instead.`
      }

      const cohere = new CohereClient({
        token: process.env.COHERE_API_KEY,
      })

      const reranked = await cohere.rerank({
        query: requirements,
        documents: matches.map(
          (match) => (match.metadata?.text ?? '') as string,
        ),
      })

      const mostSimilarPullRequest = reranked.results.map(
        (result) =>
          matches[result.index]
            .metadata as unknown as PullRequestChangeMetadata,
      )[0]

      const pullRequest = await dbClient
        .selectFrom('homie.pull_request')
        .where('organization_id', '=', organization.id)
        .where('id', '=', mostSimilarPullRequest.pull_request_id)
        .select(['github_repo_id', 'gitlab_project_id'])
        .executeTakeFirst()

      if (!pullRequest) {
        logger.debug('Missing Pull Request record', {
          event: 'find_write_code_repo:missing_pr_record',
          answer_id: answerID,
          organization: getOrganizationLogData(organization),
          requirements,
        })

        return `Could not find a matching repo. Try calling 'list_github_repos' or 'list_gitlab_projects' tool and selecting one from there instead.`
      }

      if (pullRequest.github_repo_id) {
        logger.debug('Found Github repo id', {
          event: 'find_write_code_repo:found_github_repo',
          answer_id: answerID,
          organization: getOrganizationLogData(organization),
          requirements,
          github_repo_id: pullRequest.github_repo_id,
        })

        return `github_repo_id: ${pullRequest.github_repo_id}`
      }

      if (pullRequest.gitlab_project_id) {
        logger.debug('Found Gitlab project id', {
          event: 'find_write_code_repo:found_gitlab_project',
          answer_id: answerID,
          organization: getOrganizationLogData(organization),
          requirements,
          gitlab_project_id: pullRequest.gitlab_project_id,
        })

        return `gitlab_project_id: ${pullRequest.gitlab_project_id}`
      }

      logger.debug('Missing Github Repo ID and Gitlab Project ID', {
        event: 'find_write_code_repo:missing_repo_ids',
        answer_id: answerID,
        organization: getOrganizationLogData(organization),
        requirements,
      })

      return `Could not find a matching repo. Try calling 'list_github_repos' or 'list_gitlab_projects' tool and selecting one from there instead.`
    },
  })
}

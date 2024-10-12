import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { Octokit } from '@octokit/rest'
import { createAppAuth } from '@octokit/auth-app'

interface GetGithubContextToolParams {
  organization: {
    id: number
    ext_gh_install_id: number | null
  }
  answerID: string
  context?: {
    type: 'github'
    repository: string
    issueNumber: number
  }
}

export function getGithubContextTool(params: GetGithubContextToolParams) {
  const { organization, answerID: answerId, context } = params

  return new DynamicStructuredTool({
    name: 'get_github_context',
    description: 'Get context information for a GitHub issue or pull request',
    schema: z.object({}),
    func: async () => {
      logger.debug('Call - Get GitHub Context', {
        event: 'get_answer:get_github_context:call',
        answer_id: answerId,
        organization: getOrganizationLogData(organization),
        context,
      })

      if (!context || context.type !== 'github' || !organization.ext_gh_install_id) {
        return 'No GitHub context available'
      }

      try {
        const octokit = new Octokit({
          authStrategy: createAppAuth,
          auth: {
            appId: process.env.GITHUB_APP_ID!,
            privateKey: process.env.GITHUB_PRIVATE_KEY!,
            installationId: organization.ext_gh_install_id,
          },
        })

        const [owner, repo] = context.repository.split('/')
        const { data: issue } = await octokit.issues.get({
          owner,
          repo,
          issue_number: context.issueNumber,
        })

        const { data: comments } = await octokit.issues.listComments({
          owner,
          repo,
          issue_number: context.issueNumber,
        })

        const result = {
          title: issue.title,
          body: issue.body,
          state: issue.state,
          comments: comments.map(comment => ({
            body: comment.body,
            user: comment.user?.login,
            created_at: comment.created_at,
          })),
        }

        logger.debug('Got GitHub context', {
          event: 'get_answer:get_github_context:success',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          context,
        })

        return JSON.stringify(result)
      } catch (error) {
        logger.error('Failed to get GitHub context', {
          event: 'get_answer:get_github_context:error',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          context,
          error,
        })

        return 'Failed to get GitHub context'
      }
    },
  })
}

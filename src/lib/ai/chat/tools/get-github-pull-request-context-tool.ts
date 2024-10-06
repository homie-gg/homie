import { DynamicTool } from '@langchain/core/tools'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { createGithubClient } from '@/lib/github/create-github-client'

interface GetGitHubPullRequestContextToolParams {
  organization: {
    id: number
    ext_gh_install_id: number | null
  }
  answerID: string
  channelID: string
}

export function getGitHubPullRequestContextTool(
  params: GetGitHubPullRequestContextToolParams,
) {
  const { organization, answerID, channelID } = params
  return new DynamicTool({
    name: 'get_github_pull_request_context',
    description: 'Get context about the current GitHub pull request',
    func: async () => {
      logger.debug('Call - Get GitHub Pull Request Context', {
        event: 'get_answer:get_github_pr_context:call',
        answer_id: answerID,
        organization: getOrganizationLogData(organization),
      })

      try {
        if (!organization.ext_gh_install_id) {
          return 'GitHub is not configured for this organization.'
        }

        const github = await createGithubClient({
          installationId: organization.ext_gh_install_id,
        })

        const [, repoId] = channelID.split('-')
        const repo = await github.rest.repos.getById({
          repo_id: parseInt(repoId),
        })

        const pulls = await github.rest.pulls.list({
          owner: repo.data.owner.login,
          repo: repo.data.name,
          state: 'open',
        })

        const prContext = pulls.data.map((pr) => ({
          number: pr.number,
          title: pr.title,
          user: pr.user.login,
          created_at: pr.created_at,
          updated_at: pr.updated_at,
          html_url: pr.html_url,
        }))

        return JSON.stringify(prContext)
      } catch (error) {
        logger.debug('Failed to get GitHub PR context', {
          event: 'get_answer:get_github_pr_context:failed',
          answer_id: answerID,
          organization: getOrganizationLogData(organization),
          error: error instanceof Error ? error.message : 'unknown',
        })

        return 'FAILED'
      }
    },
  })
}

import { dbClient } from '@/database/client'
import { createGithubClient } from '@/lib/github/create-github-client'
import { listPullRequestCommits } from '@/lib/github/list-pull-request-commits'
import { getMergeRequestDiff } from '@/lib/gitlab/get-merge-request-diff'
import { listMergeRequestCommits } from '@/lib/gitlab/list-merge-request-commits'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { zodFunction } from 'openai/helpers/zod.mjs'
import { z } from 'zod'

interface getFetchPullRequestDetailToolParams {
  organization: {
    id: number
  }
  answerId: string
}

export function getFetchPullRequestDetailTool(
  params: getFetchPullRequestDetailToolParams,
) {
  const { organization, answerId } = params

  const { id: orgId } = organization
  return zodFunction({
    name: 'fetch_pull_request_details',
    description: 'Fetches details for a specific pull request',
    parameters: z.object({
      pull_request_id: z
        .number()
        .describe('ID of the pull request to fetch details for'),
    }),
    function: async ({ pull_request_id }) => {
      logger.debug('Call - fetch PR details', {
        event: 'get_answer:fetch_pr_details:call',
        answer_id: answerId,
        organization: getOrganizationLogData(organization),
        pull_request_id,
      })

      try {
        const pullRequest = await dbClient
          .selectFrom('homie.pull_request')
          .where('id', '=', pull_request_id)
          .where('organization_id', '=', orgId)
          .select([
            'ext_gh_pull_request_id',
            'number',
            'ext_gitlab_merge_request_id',
            'organization_id',
            'github_repo_id',
            'gitlab_project_id',
            'ext_gitlab_merge_request_iid',
          ])
          .executeTakeFirst()

        if (!pullRequest) {
          logger.debug('Missing PR with id', {
            event: 'get_answer:fetch_pr_details:missing_pr',
            answer_id: answerId,
            pull_request_id,
          })
          return 'Could not find Pull Request with that ID'
        }

        const organization = await dbClient
          .selectFrom('homie.organization')
          .where('homie.organization.id', '=', pullRequest.organization_id)
          .leftJoin(
            'gitlab.app_user',
            'gitlab.app_user.organization_id',
            'homie.organization.id',
          )
          .leftJoin(
            'github.organization',
            'github.organization.organization_id',
            'homie.organization.id',
          )
          .select([
            'homie.organization.id',
            'gitlab_access_token',
            'github.organization.ext_gh_install_id',
          ])
          .executeTakeFirstOrThrow()

        // GitHub
        if (
          pullRequest.ext_gh_pull_request_id &&
          organization.ext_gh_install_id &&
          pullRequest.github_repo_id
        ) {
          const repo = await dbClient
            .selectFrom('github.repo')
            .where('id', '=', pullRequest.github_repo_id)
            .select(['owner', 'name'])
            .executeTakeFirstOrThrow()

          if (!repo.owner) {
            return 'FAILED - GitHub repo missing owner'
          }

          const github = await createGithubClient({
            installationId: organization.ext_gh_install_id,
          })

          const commits = await listPullRequestCommits({
            installationId: organization.ext_gh_install_id,
            repo: repo.name,
            owner: repo.owner,
            pullRequestNumber: pullRequest.number,
          })

          const diff = await github.rest.pulls
            .get({
              pull_number: pullRequest.number,
              headers: {
                accept: 'application/vnd.github.v3.diff',
              },
              repo: repo.name,
              owner: repo.owner,
            })
            .then((res) => res.data as unknown as string) // diff is a string

          return JSON.stringify({
            commits,
            diff: diff ?? '',
          })
        }

        // Gitlab
        if (
          pullRequest.ext_gitlab_merge_request_id &&
          pullRequest.ext_gitlab_merge_request_iid &&
          organization.gitlab_access_token
        ) {
          const project = await dbClient
            .selectFrom('gitlab.project')
            .where('id', '=', pullRequest.gitlab_project_id)
            .select(['ext_gitlab_project_id'])
            .executeTakeFirstOrThrow()

          const commits = await listMergeRequestCommits({
            gitlabAccessToken: organization.gitlab_access_token,
            projectId: project.ext_gitlab_project_id,
            mergeRequestIid: pullRequest.ext_gitlab_merge_request_iid,
          })

          const diff = await getMergeRequestDiff({
            gitlabAccessToken: organization.gitlab_access_token,
            projectId: project.ext_gitlab_project_id,
            mergeRequestIid: pullRequest.ext_gitlab_merge_request_iid,
          })

          return JSON.stringify({
            commits,
            diff,
          })
        }

        return 'Failed to fetch Pull Request details. Missing GitHub or Gitlab setup.'
      } catch (error) {
        logger.debug('Failed to fetch PR details', {
          event: 'get_answer:fetch_pr_details:failed',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          pull_request_id,
          error,
        })

        return 'FAILED. Try again later.'
      }
    },
  })
}

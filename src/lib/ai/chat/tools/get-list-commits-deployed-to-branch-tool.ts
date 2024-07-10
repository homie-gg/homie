import { dbClient } from '@/database/client'
import { listPullRequestCommits } from '@/lib/github/list-pull-request-commits'
import { listMergeRequestCommits } from '@/lib/gitlab/list-merge-request-commits'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { endOfDay, startOfDay } from 'date-fns'
import { z } from 'zod'

interface getListCommitsDeployedToBranchToolParams {
  organization: {
    id: number
  }
  answerId: string
}

export function getListCommitsDeployedToBranchTool(
  params: getListCommitsDeployedToBranchToolParams,
) {
  const { organization, answerId } = params

  const { id: orgId } = organization
  return new DynamicStructuredTool({
    name: 'list_commits_deployed_to_branch',
    description:
      'Lists all the commits that were deployed to a specific branch',
    schema: z.object({
      branch: z
        .string()
        .describe('Branch that we want to get commits for')
        .optional(),
      startDate: z.coerce
        .date()
        .describe('The lower bound date of commits to include'),
      endDate: z.coerce
        .date()
        .describe('The upper bound date of commits to include'),
    }),
    func: async ({ branch, startDate, endDate }) => {
      logger.debug('Call - list commits deployed to branch', {
        event: 'get_answer:list_commits_deployed:call',
        answer_id: answerId,
        organization: getOrganizationLogData(organization),
        branch,
        startDate,
        endDate,
      })

      try {
        const pullRequests = await dbClient
          .selectFrom('homie.pull_request')
          .where('homie.pull_request.organization_id', '=', orgId)
          .innerJoin(
            'homie.contributor',
            'homie.contributor.id',
            'homie.pull_request.contributor_id',
          )
          .orderBy('homie.pull_request.created_at desc')
          .select([
            'ext_gh_pull_request_id',
            'number',
            'ext_gitlab_merge_request_id',
            'homie.pull_request.organization_id',
            'github_repo_id',
            'gitlab_project_id',
            'ext_gitlab_merge_request_iid',
          ])
          .where(
            'homie.pull_request.created_at',
            '>',
            startOfDay(new Date(startDate)),
          )
          .where(
            'homie.pull_request.created_at',
            '<',
            endOfDay(new Date(endDate)),
          )
          .where('target_branch', 'ilike', `%${branch}%`)
          .execute()

        const organization = await dbClient
          .selectFrom('homie.organization')
          .where('homie.organization.id', '=', orgId)
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

        const commits: Array<{ author: string; message: string }> = []

        for (const pullRequest of pullRequests) {
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

            const commits = await listPullRequestCommits({
              installationId: organization.ext_gh_install_id,
              repo: repo.name,
              owner: repo.owner,
              pullRequestNumber: pullRequest.number,
            })

            commits.push(...commits)
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

            commits.push(...commits)
          }
        }

        if (commits.length === 0) {
          logger.debug('No commits found', {
            event: 'get_answer:list_commits_deployed:no_commits_found',
            answer_id: answerId,
            organization: getOrganizationLogData(organization),
            branch,
            startDate,
            endDate,
          })

          return `Nothing has been deployed ${branch} from ${startDate} to ${endDate}`
        }

        const result = commits
          .map((commit) => `- ${commit.message} by ${commit.author}`)
          .join('\n')

        logger.debug('Found commits', {
          event: 'get_answer:list_commits_deployed:found_commits',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          branch,
          startDate,
          endDate,
          result,
        })

        return result
      } catch (error) {
        logger.debug('Failed to fetch commits for branch', {
          event: 'get_answer:list_commits_deployed:failed',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          branch,
          startDate,
          endDate,
          error,
        })

        return 'FAILED'
      }
    },
  })
}

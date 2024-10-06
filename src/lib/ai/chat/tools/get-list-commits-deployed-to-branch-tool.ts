import { dbClient } from '@/database/client'
import { listPullRequestCommits } from '@/lib/github/list-pull-request-commits'
import { listMergeRequestCommits } from '@/lib/gitlab/list-merge-request-commits'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { formatDistance } from 'date-fns'

interface getListCommitsDeployedToBranchToolParams {
  organization: {
    id: number
  }
  answerID: string
  onAnswer: (answer: string) => void
}

export function getListCommitsDeployedToBranchTool(
  params: getListCommitsDeployedToBranchToolParams,
) {
  const { organization, answerID: answerId, onAnswer } = params

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
            'html_url',
            'merged_at',
          ])
          .where('homie.pull_request.merged_at', 'is not', null)
          .where('homie.pull_request.merged_at', '>', startDate)
          .where('homie.pull_request.merged_at', '<', endDate)
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

        const items: Record<
          string,
          Array<{
            author?: string
            message: string
            merged_at: Date
            url: string
          }>
        > = {}

        for (const pullRequest of pullRequests) {
          const mergedAt = pullRequest.merged_at
          if (!mergedAt) {
            continue
          }

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

            items[repo.name] = [
              ...(items[repo.name] ?? []),
              ...commits.map((commit) => ({
                ...commit,
                url: pullRequest.html_url,
                merged_at: mergedAt,
              })),
            ]
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
              .select(['ext_gitlab_project_id', 'name'])
              .executeTakeFirstOrThrow()

            const commits = await listMergeRequestCommits({
              gitlabAccessToken: organization.gitlab_access_token,
              projectId: project.ext_gitlab_project_id,
              mergeRequestIid: pullRequest.ext_gitlab_merge_request_iid,
            })

            items[project.name] = [
              ...(items[project.name] ?? []),
              ...commits.map((commit) => ({
                ...commit,
                url: pullRequest.html_url,
                merged_at: mergedAt,
              })),
            ]
          }
        }

        if (Object.keys(items).length === 0) {
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

        const result = Object.entries(items)
          .map(
            ([repo, commits]) =>
              `## ${repo}\n${commits.map((commit) => `- ${commit.message} by ${commit.author} ${formatDistance(commit.merged_at, new Date(), { addSuffix: true })} via [PR](${commit.url})`).join('\n')}`,
          )
          .join('\n\n')

        logger.debug('Found commits', {
          event: 'get_answer:list_commits_deployed:found_commits',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          branch,
          startDate,
          endDate,
          result,
        })

        onAnswer(result)
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

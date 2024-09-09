import { createJob } from '@/queue/create-job'
import { dbClient } from '@/database/client'
import { getIsOverPlanContributorLimit } from '@/lib/billing/get-is-over-plan-contributor-limit'
import { createGitlabClient } from '@/lib/gitlab/create-gitlab-client'
import { getMergeRequestLogData } from '@/lib/gitlab/get-merge-request-log-data'
import { saveMergedMergeRequest as saveMergeRequest } from '@/lib/gitlab/save-merged-merge-request'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { dispatch } from '@/queue/dispatch'

export const saveMergedMergeRequest = createJob({
  id: 'save_merged_merge_request',
  handle: async (payload: {
    merge_request: {
      created_at: string
      id: number
      iid: number
      title: string
      target_project_id: number
      author_id: number
      description: string | null
      merged_at?: string
    }
    project: {
      default_branch: string
    }
    organization: {
      id: number
      has_unlimited_usage: boolean | null
      gitlab_access_token: string
      trello_access_token: string | null
      asana_access_token: string | null
      slack_access_token: string | null
    }
  }) => {
    const {
      merge_request,
      organization,
      project: { default_branch: defaultBranch },
    } = payload

    logger.debug('Start save merged MR', {
      event: 'save_merged_merge_request.start',
      merge_request: getMergeRequestLogData(merge_request),
    })

    const project = await dbClient
      .selectFrom('gitlab.project')
      .where('organization_id', '=', organization.id)
      .where('ext_gitlab_project_id', '=', merge_request.target_project_id)
      .where('enabled', '=', true)
      .select(['id', 'name', 'ext_gitlab_project_id', 'enabled'])
      .executeTakeFirst()

    if (!project) {
      logger.debug('Missing project; is the project enabled?', {
        event: 'save_merged_merge_request.missing_project',
        merge_request: getMergeRequestLogData(merge_request),
        organization: getOrganizationLogData(organization),
      })

      return
    }

    if (await getIsOverPlanContributorLimit({ organization })) {
      logger.debug('org over plan contributor limit', {
        event: 'save_merged_merge_request.org_over_plan_limit',
        merge_request: getMergeRequestLogData(merge_request),
        organization: getOrganizationLogData(organization),
      })
      return
    }

    const gitlab = createGitlabClient(organization.gitlab_access_token)

    const mergeRequestInfo = await gitlab.MergeRequests.show(
      project.ext_gitlab_project_id,
      merge_request.iid,
    )

    const pullRequest = await saveMergeRequest({
      mergeRequest: mergeRequestInfo,
      organization,
      project,
      defaultBranch,
    })

    if (pullRequest) {
      await dispatch(
        'check_for_unclosed_task',
        {
          pull_request: {
            ...pullRequest,
            merged_at: pullRequest.merged_at?.toISOString() ?? null,
            created_at: pullRequest.created_at.toISOString(),
          },
          summary: pullRequest.summary,
        },
        {
          debounce: {
            key: `check_unclosed_task:pull_request:${pullRequest.id}`,
            delaySecs: 120,
          },
        },
      )
    }
  },
})

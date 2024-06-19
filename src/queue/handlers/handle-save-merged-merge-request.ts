import { dbClient } from '@/database/client'
import { getIsOverPlanContributorLimit } from '@/lib/billing/get-is-over-plan-contributor-limit'
import { createGitlabClient } from '@/lib/gitlab/create-gitlab-client'
import { getMergeRequestLogData } from '@/lib/gitlab/get-merge-request-log-data'
import { saveMergedMergeRequest } from '@/lib/gitlab/save-merged-merge-request'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { SaveMergedMergeRequest } from '@/queue/jobs'

export async function handleSaveMergedMergeRequest(
  job: SaveMergedMergeRequest,
) {
  const { merge_request, organization } = job.data

  logger.debug('Start save merged MR', {
    event: 'save_merged_merge_request.start',
    data: {
      merge_request: getMergeRequestLogData(merge_request),
    },
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
      data: {
        merge_request: getMergeRequestLogData(merge_request),
        organization: getOrganizationLogData(organization),
      },
    })

    return
  }

  if (await getIsOverPlanContributorLimit({ organization })) {
    logger.debug('org over plan contributor limit', {
      event: 'save_merged_merge_request.org_over_plan_limit',
      data: {
        merge_request: getMergeRequestLogData(merge_request),
        organization: getOrganizationLogData(organization),
      },
    })
    return
  }

  const gitlab = createGitlabClient(organization.gitlab_access_token)

  const mergeRequestInfo = await gitlab.MergeRequests.show(
    project.ext_gitlab_project_id,
    merge_request.iid,
  )

  await saveMergedMergeRequest({
    mergeRequest: mergeRequestInfo,
    organization,
    project,
  })
}

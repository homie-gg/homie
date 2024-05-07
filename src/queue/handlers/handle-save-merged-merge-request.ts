import { dbClient } from '@/database/client'
import { getIsOverPlanPRLimit } from '@/lib/billing/get-is-over-plan-pr-limit'
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

  if (organization.is_over_plan_pr_limit && !organization.has_unlimited_usage) {
    logger.debug('org over plan limit', {
      event: 'save_merged_merge_request.org_over_plan_limit',
      data: {
        merge_request: getMergeRequestLogData(merge_request),
        organization: getOrganizationLogData(organization),
      },
    })
    return
  }

  const isOverPlanPRLimit = await getIsOverPlanPRLimit({
    organization,
    pr_limit_per_month: organization.pr_limit_per_month,
  })

  if (isOverPlanPRLimit && !organization.has_unlimited_usage) {
    await dbClient
      .updateTable('homie.organization')
      .set({
        is_over_plan_pr_limit: true,
      })
      .where('homie.organization.id', '=', organization.id)
      .executeTakeFirstOrThrow()
    logger.debug('org over plan limit', {
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

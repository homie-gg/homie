import { dbClient } from '@/database/client'
import { getOverPRLimitMessage } from '@/lib/billing/get-over-pr-limit-message'
import { createGitlabClient } from '@/lib/gitlab/create-gitlab-client'
import { getLinkedIssuesAndTasksInMergeRequest } from '@/lib/gitlab/get-linked-issues-and-tasks-in-merge-request'
import { getMergeRequestLogData } from '@/lib/gitlab/get-merge-request-log-data'
import { summarizeGitlabMergeRequest } from '@/lib/gitlab/summarize-gitlab-merge-request'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { summaryKey } from '@/queue/handlers/handle-generate-open-pull-request-summary'
import { GenerateOpenMergeRequestSummary } from '@/queue/jobs'

export async function handleGenerateOpenMergeRequestSummary(
  job: GenerateOpenMergeRequestSummary,
) {
  const { organization, merge_request } = job.data

  const project = await dbClient
    .selectFrom('gitlab.project')
    .where('organization_id', '=', organization.id)
    .where('ext_gitlab_project_id', '=', merge_request.target_project_id)
    .where('enabled', '=', true)
    .select(['id', 'name', 'ext_gitlab_project_id', 'enabled'])
    .executeTakeFirst()

  if (!project) {
    logger.debug('Missing project; is the project enabled?', {
      event: 'generate_open_merge_request_summary.missing_project',
      data: {
        merge_request: getMergeRequestLogData(merge_request),
        organization: getOrganizationLogData(organization),
      },
    })

    return
  }

  const gitlab = createGitlabClient(organization.gitlab_access_token)

  if (organization.is_over_plan_pr_limit && !organization.has_unlimited_usage) {
    const bodyWithSummary = merge_request.description?.replace(
      summaryKey,
      getOverPRLimitMessage(),
    ) // avoid infinite loop of summaries by replacing the key if it exists

    await gitlab.MergeRequests.edit(
      project.ext_gitlab_project_id,
      merge_request.iid,
      {
        description: bodyWithSummary,
      },
    )

    return
  }

  const issue = await getLinkedIssuesAndTasksInMergeRequest({
    mergeRequest: merge_request,
    organization,
  })

  const { summary } = await summarizeGitlabMergeRequest({
    mergeRequest: merge_request,
    length: 'short',
    issue,
    gitlab,
    project,
  })

  const bodyWithSummary = merge_request.description
    ?.replace(summaryKey, summary)
    .replace(summaryKey, 'summary key') // avoid infinite loop of summaries by replacing the key if it exists

  await gitlab.MergeRequests.edit(
    project.ext_gitlab_project_id,
    merge_request.iid,
    {
      description: bodyWithSummary,
    },
  )
}
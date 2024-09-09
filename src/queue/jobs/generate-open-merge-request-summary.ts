import { createJob } from '@/queue/create-job'
import { dbClient } from '@/database/client'
import { getIsOverPlanContributorLimit } from '@/lib/billing/get-is-over-plan-contributor-limit'
import { getOverContributorLimitMessage } from '@/lib/billing/get-over-contributor-limit-message'
import { createGitlabClient } from '@/lib/gitlab/create-gitlab-client'
import { getLinkedIssuesAndTasksInMergeRequest } from '@/lib/gitlab/get-linked-issues-and-tasks-in-merge-request'
import { getMergeRequestLogData } from '@/lib/gitlab/get-merge-request-log-data'
import { summarizeGitlabMergeRequest } from '@/lib/gitlab/summarize-gitlab-merge-request'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { getReferencedSlackMessages } from '@/lib/slack/get-referenced-slack-messages'
import { summaryKey } from '@/queue/jobs/generate-open-pull-request-summary'

export const generateOpenMergeRequestSummary = createJob({
  id: 'generate_open_merge_request_summary',
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
    organization: {
      id: number
      has_unlimited_usage: boolean | null
      gitlab_access_token: string
      trello_access_token: string | null
      asana_access_token: string | null
      slack_access_token: string | null
    }
  }) => {
    const { organization, merge_request } = payload

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
        merge_request: getMergeRequestLogData(merge_request),
        organization: getOrganizationLogData(organization),
      })

      return
    }

    const gitlab = createGitlabClient(organization.gitlab_access_token)

    if (await getIsOverPlanContributorLimit({ organization })) {
      await gitlab.MergeRequests.edit(
        project.ext_gitlab_project_id,
        merge_request.iid,
        {
          description: merge_request.description?.replace(
            summaryKey,
            getOverContributorLimitMessage(),
          ),
        },
      )

      return
    }

    const issue = await getLinkedIssuesAndTasksInMergeRequest({
      mergeRequest: merge_request,
      organization,
    })

    const conversation = organization.slack_access_token
      ? await getReferencedSlackMessages({
          pullRequestBody: merge_request.description,
          organization: {
            id: organization.id,
            slack_access_token: organization.slack_access_token,
          },
        })
      : null

    const { summary } = await summarizeGitlabMergeRequest({
      mergeRequest: merge_request,
      length: 'short',
      issue,
      gitlab,
      project,
      conversation,
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
  },
})

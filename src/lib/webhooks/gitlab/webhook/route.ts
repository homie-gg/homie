import { createGitlabClient } from '@/lib/gitlab/create-gitlab-client'
import { generatePRSummary } from '@/lib/ai/generate-pr-summary'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'

export async function handleGitlabPROpened(
  organization: {
    id: number
    gitlab_access_token: string
  },
  prData: any
) {
  try {
    const summary = await generatePRSummary(prData)

    const gitlab = createGitlabClient(organization.gitlab_access_token)

    await gitlab.MergeRequestNotes.create(
      prData.project_id,
      prData.iid,
      `## Homie Summary\n\n${summary}`,
    )

    logger.debug('Successfully added summary comment to GitLab PR', {
      event: 'pr_opened:success',
      organization: getOrganizationLogData(organization),
      pr_title: prData.title,
      pr_web_url: prData.web_url,
    })
  } catch (error) {
    logger.error('Failed to add summary comment to GitLab PR', {
      event: 'pr_opened:error',
      organization: getOrganizationLogData(organization),
      pr_title: prData.title,
      pr_web_url: prData.web_url,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

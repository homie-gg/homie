import { createGithubClient } from '@/lib/github/create-github-client'
import { generatePRSummary } from '@/lib/ai/generate-pr-summary'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'

export async function handleGithubPROpened(
  organization: {
    id: number
    ext_gh_install_id: number
  },
  prData: any,
) {
  try {
    const summary = await generatePRSummary(prData)

    const github = await createGithubClient({
      installationId: organization.ext_gh_install_id,
    })

    await github.rest.issues.createComment({
      owner: prData.repository.owner.login,
      repo: prData.repository.name,
      issue_number: prData.number,
      body: `## Homie Summary\n\n${summary}`,
    })

    logger.debug('Successfully added summary comment to GitHub PR', {
      event: 'pr_opened:success',
      organization: getOrganizationLogData(organization),
      pr_title: prData.title,
      pr_html_url: prData.html_url,
    })
  } catch (error) {
    logger.error('Failed to add summary comment to GitHub PR', {
      event: 'pr_opened:error',
      organization: getOrganizationLogData(organization),
      pr_title: prData.title,
      pr_html_url: prData.html_url,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

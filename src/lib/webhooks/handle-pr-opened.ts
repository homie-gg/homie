import { createGithubClient } from '@/lib/github/create-github-client'
import { createGitlabClient } from '@/lib/gitlab/create-gitlab-client'
import { generatePRSummary } from '@/lib/ai/generate-pr-summary'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'

export async function handlePROpened(
  organization: {
    id: number
    ext_gh_install_id: number | null
    gitlab_access_token: string | null
  },
  prData: any,
  source: 'github' | 'gitlab'
) {
  try {
    const summary = await generatePRSummary(prData)

    if (source === 'github' && organization.ext_gh_install_id) {
      const github = await createGithubClient({
        installationId: organization.ext_gh_install_id,
      })

      await github.rest.issues.createComment({
        owner: prData.repository.owner.login,
        repo: prData.repository.name,
        issue_number: prData.number,
        body: `## Homie Summary\n\n${summary}`,
      })
    } else if (source === 'gitlab' && organization.gitlab_access_token) {
      const gitlab = createGitlabClient(organization.gitlab_access_token)

      await gitlab.MergeRequestNotes.create(
        prData.project_id,
        prData.iid,
        `## Homie Summary\n\n${summary}`
      )
    }

    logger.debug('Successfully added summary comment to PR', {
      event: 'pr_opened:success',
      organization: getOrganizationLogData(organization),
      pr_title: prData.title,
      pr_html_url: prData.html_url || prData.web_url,
    })
  } catch (error) {
    logger.error('Failed to add summary comment to PR', {
      event: 'pr_opened:error',
      organization: getOrganizationLogData(organization),
      pr_title: prData.title,
      pr_html_url: prData.html_url || prData.web_url,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

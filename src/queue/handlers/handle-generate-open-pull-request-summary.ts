import { summarizeGithubPullRequest } from '@/lib/ai/summarize-github-pull-request'
import { dbClient } from '@/lib/db/client'
import { createGithubClient } from '@/lib/github/create-github-client'
import { findLinkedIssue } from '@/lib/github/find-linked-issue'
import { GenerateOpenPullRequestSummary } from '@/queue/jobs'

/**
 * Void will replace this string inside a PR body with a generated summary.
 */
export const summaryKey = ':void-summary:'

export async function handleGenerateOpenPullRequestSummary(
  job: GenerateOpenPullRequestSummary,
) {
  const { pull_request, installation } = job.data

  const organization = await dbClient
    .selectFrom('voidpm.organization')
    .innerJoin(
      'github.organization',
      'github.organization.organization_id',
      'voidpm.organization.id',
    )
    .where('ext_gh_install_id', '=', installation?.id!)
    .select(['voidpm.organization.id', 'github.organization.ext_gh_install_id'])
    .executeTakeFirst()

  if (!organization) {
    return
  }

  const github = await createGithubClient({
    installationId: organization.ext_gh_install_id,
  })

  const owner = pull_request.base.repo.full_name.split('/')[0]

  const issue = await findLinkedIssue({
    pullRequest: {
      body: pull_request.body,
    },
    repo: pull_request.base.repo.name,
    owner,
    github,
  })

  const summary = await summarizeGithubPullRequest({
    pullRequest: {
      body: pull_request.body,
      repo_id: pull_request.base.repo.id,
      pull_number: pull_request.number,
      title: pull_request.title,
    },
    repo: pull_request.base.repo.name,
    owner,
    github,
    issue: issue?.body ?? null,
  })

  const bodyWithSummary = pull_request.body?.replace(summaryKey, summary)

  await github.rest.pulls.update({
    owner,
    repo: pull_request.base.repo.name,
    pull_number: pull_request.number,
    body: bodyWithSummary,
  })
}

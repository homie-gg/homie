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

  // Create Github User if doesn't exits
  const contributor = await dbClient
    .insertInto('voidpm.contributor')
    .values({
      ext_gh_user_id: pull_request.user.id,
      organization_id: organization.id,
      username: pull_request.user.login ?? '',
    })
    .onConflict((oc) =>
      oc.column('ext_gh_user_id').doUpdateSet({
        organization_id: organization.id,
        username: pull_request.user?.login ?? '',
      }),
    )
    .returning('id')
    .executeTakeFirstOrThrow()

  const { summary } = await summarizeGithubPullRequest({
    pullRequest: {
      body: pull_request.body,
      repo_id: pull_request.base.repo.id,
      pull_number: pull_request.number,
      title: pull_request.title,
      merged_at: pull_request.merged_at!,
      base: pull_request.base,
      html_url: pull_request.html_url,
    },
    repo: pull_request.base.repo.name,
    owner,
    github,
    issue: issue?.body ?? null,
    length: 'short',
    contributor_id: contributor.id,
  })

  const bodyWithSummary = pull_request.body
    ?.replace(summaryKey, summary)
    .replace(summaryKey, 'summary key') // avoid infinite loop of summaries by replacing the key if it exists

  await github.rest.pulls.update({
    owner,
    repo: pull_request.base.repo.name,
    pull_number: pull_request.number,
    body: bodyWithSummary,
  })
}
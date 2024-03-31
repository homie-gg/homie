import { embedGithubPullRequest } from '@/lib/ai/embed-github-pull-request'
import { summarizeGithubPullRequest } from '@/lib/ai/summarize-github-pull-request'
import { dbClient } from '@/lib/db/client'
import { createGithubClient } from '@/lib/github/create-github-client'
import { findLinkedIssue } from '@/lib/github/find-linked-issue'
import { parseISO } from 'date-fns'

interface SaveMergedPullRequestParams {
  pullRequest: {
    created_at: string
    html_url: string
    title: string
    merged_at: string | null
    body: string | null
    id: number
    number: number
    user: {
      id: number
      login: string
    }
    base: {
      ref: string
      repo: {
        name: string
        html_url: string
        id: number
        default_branch: string
        full_name: string
      }
    }
  }
  organization: {
    id: number
    ext_gh_install_id: number
  }
}

export async function saveMergedPullRequest(
  params: SaveMergedPullRequestParams,
) {
  const { pullRequest, organization } = params

  /**
   * Whether PR was successfully merged (not closed).
   */
  if (!pullRequest.merged_at) {
    return
  }

  /**
   * Wether the PR was to default. e.g., 'main'
   */
  const isDefaultBranchPR =
    pullRequest.base.ref === pullRequest.base.repo.default_branch

  if (!isDefaultBranchPR) {
    return
  }

  // Create Github User if doesn't exits
  const githubUser = await dbClient
    .insertInto('github.user')
    .values({
      ext_gh_user_id: pullRequest.user.id,
      organization_id: organization.id,
      username: pullRequest.user.login ?? '',
    })
    .onConflict((oc) =>
      oc.column('ext_gh_user_id').doUpdateSet({
        organization_id: organization.id,
        username: pullRequest.user?.login ?? '',
      }),
    )
    .returning('id')
    .executeTakeFirstOrThrow()

  const repo = await dbClient
    .insertInto('github.repo')
    .values({
      organization_id: organization.id,
      name: pullRequest.base.repo.name,
      html_url: pullRequest.base.repo.html_url,
      ext_gh_repo_id: pullRequest.base.repo.id,
    })
    .onConflict((oc) =>
      oc.column('ext_gh_repo_id').doUpdateSet({
        organization_id: organization.id,
        name: pullRequest.base.repo.name,
        html_url: pullRequest.base.repo.html_url,
      }),
    )
    .returning('id')
    .executeTakeFirstOrThrow()

  const github = await createGithubClient({
    installationId: organization.ext_gh_install_id,
  })

  const owner = pullRequest.base.repo.full_name.split('/')[0]

  const issue = await findLinkedIssue({
    pullRequest: {
      body: pullRequest.body,
    },
    repo: pullRequest.base.repo.name,
    owner,
    github,
  })

  const summary = await summarizeGithubPullRequest({
    pullRequest: {
      body: pullRequest.body,
      repo_id: pullRequest.base.repo.id,
      pull_number: pullRequest.number,
    },
    repo: pullRequest.base.repo.name,
    owner,
    github,
    issue: issue?.body ?? null,
    user_id: githubUser.id,
  })

  const pullRequestRecord = await dbClient
    .insertInto('github.pull_request')
    .values({
      created_at: parseISO(pullRequest.created_at),
      ext_gh_pull_request_id: pullRequest.id,
      organization_id: organization.id,
      user_id: githubUser.id,
      title: pullRequest.title,
      html_url: pullRequest.html_url,
      repo_id: repo.id,
      body: pullRequest.body ?? '',
      merged_at: parseISO(pullRequest.merged_at),
      summary,
      number: pullRequest.number,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  await embedGithubPullRequest({ pullRequest: pullRequestRecord })
}

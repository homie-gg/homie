import { app } from '@/lib/github/app'
import { dbClient } from '@/lib/db/client'
import { embedGithubPullRequest } from '@/lib/ai/embed-github-pull-request'
import { summarizeGithubPullRequest } from '@/lib/ai/summarize-github-pull-request'
import { createGithubClient } from '@/lib/github/create-github-client'
import { findLinkedIssue } from '@/lib/github/find-linked-issue'

app.webhooks.on('pull_request.closed', async (params) => {
  const {
    payload: { pull_request, installation, repository },
  } = params

  /**
   * Whether PR was successfully merged (not closed).
   */
  const wasMerged = pull_request.merged

  if (!wasMerged) {
    return
  }

  /**
   * Wether the PR was to default. e.g., 'main'
   */
  const isDefaultBranchPR =
    pull_request.base.ref === pull_request.base.repo.default_branch

  if (!isDefaultBranchPR) {
    return
  }

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

  // Create Github User if doesn't exits
  const githubUser = await dbClient
    .insertInto('github.user')
    .values({
      ext_gh_user_id: pull_request.user.id,
      organization_id: organization.id,
      username: pull_request.user.name ?? '',
    })
    .onConflict((oc) => oc.column('ext_gh_user_id').doNothing())
    .returning('id')
    .executeTakeFirstOrThrow()

  // Create repo
  const repo = await dbClient
    .insertInto('github.repo')
    .values({
      organization_id: organization.id,
      name: repository.name,
      html_url: repository.html_url,
      ext_gh_repo_id: repository.id,
    })
    .onConflict((oc) => oc.column('ext_gh_repo_id').doNothing())
    .returning('id')
    .executeTakeFirstOrThrow()

  // Embed pr

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
    },
    repo: pull_request.base.repo.name,
    owner,
    github,
    issue: issue?.body ?? null,
    user_id: githubUser.id,
  })

  // Create Pull Request
  const pullRequest = await dbClient
    .insertInto('github.pull_request')
    .values({
      ext_gh_pull_request_id: pull_request.id,
      organization_id: organization.id,
      user_id: githubUser.id,
      title: pull_request.title,
      html_url: pull_request.html_url,
      repo_id: repo.id,
      body: pull_request.body ?? '',
      summary,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  await embedGithubPullRequest({ pullRequest })
})

export const githubWebhooks = app.webhooks

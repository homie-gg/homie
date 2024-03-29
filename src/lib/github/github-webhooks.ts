import { dbClient } from '@/lib/db/client'
import { privateKey } from '@/lib/github/create-github-client'
import { App } from 'octokit'

const app = new App({
  appId: process.env.GITHUB_APP_ID!,
  privateKey: privateKey.toString('utf-8'),
  webhooks: {
    secret: process.env.GITHUB_WEBHOOK_SECRET!,
  },
})

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
    .select('voidpm.organization.id')
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

  // Create Pull Request
  await dbClient
    .insertInto('github.pull_request')
    .values({
      ext_gh_pull_request_id: pull_request.id,
      organization_id: organization.id,
      user_id: githubUser.id,
      title: pull_request.title,
      html_url: pull_request.html_url,
      repo_id: repo.id,
    })
    .executeTakeFirstOrThrow()
})

app.webhooks.on('pull_request.opened', async (params) => {
  // create PR
  // Add timestamp for WHEN the PR was merged
})

export const githubWebhooks = app.webhooks

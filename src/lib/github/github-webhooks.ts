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
    payload: { pull_request, installation },
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
    .selectFrom('pami.organization')
    .where('ext_gh_install_id', '=', String(installation?.id))
    .select('organization_id')
    .executeTakeFirst()

  if (!organization) {
    return
  }

  // Create Github User if doesn't exits
  const githubUser = await dbClient
    .insertInto('github.user')
    .values({
      ext_gh_user_id: String(pull_request.user.id),
      organization_id: organization.organization_id,
    })
    .onConflict((oc) => oc.column('ext_gh_user_id').doNothing())
    .returning('user_id')
    .executeTakeFirstOrThrow()

  // Create Pull Request
  await dbClient
    .insertInto('github.pull_request')
    .values({
      ext_gh_pull_request_id: String(pull_request.id),
      organization_id: organization.organization_id,
      user_id: githubUser.user_id,
      title: pull_request.title,
      html_url: pull_request.html_url,
    })
    .executeTakeFirstOrThrow()
})

export const githubWebhooks = app.webhooks

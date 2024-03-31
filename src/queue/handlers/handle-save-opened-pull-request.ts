import { dbClient } from '@/lib/db/client'
import { SaveOpenedPullRequest } from '@/queue/jobs'
import { parseISO } from 'date-fns'

export async function handleSaveOpenedPullRequest(job: SaveOpenedPullRequest) {
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

  // Create Github User if doesn't exits
  const githubUser = await dbClient
    .insertInto('github.user')
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

  const repo = await dbClient
    .insertInto('github.repo')
    .values({
      organization_id: organization.id,
      name: pull_request.base.repo.name,
      html_url: pull_request.base.repo.html_url,
      ext_gh_repo_id: pull_request.base.repo.id,
    })
    .onConflict((oc) =>
      oc.column('ext_gh_repo_id').doUpdateSet({
        organization_id: organization.id,
        name: pull_request.base.repo.name,
        html_url: pull_request.base.repo.html_url,
      }),
    )
    .returning('id')
    .executeTakeFirstOrThrow()

  await dbClient
    .insertInto('github.pull_request')
    .values({
      created_at: parseISO(pull_request.created_at),
      ext_gh_pull_request_id: pull_request.id,
      organization_id: organization.id,
      user_id: githubUser.id,
      title: pull_request.title,
      html_url: pull_request.html_url,
      repo_id: repo.id,
      body: pull_request.body ?? '',
      number: pull_request.number,
      summary: '',
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

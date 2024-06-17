import { dbClient } from '@/database/client'
import { dispatch } from '@/queue/default-queue'
import {
  InstallationLite,
  Issue,
  User,
  Repository,
} from '@octokit/webhooks-types'

interface UnassignContributorFromGithubIssueParams {
  assignee?: User | null
  issue: Issue
  repository: Repository
  installation?: InstallationLite | undefined
}

export async function unassignContributorFromGithubIssue(
  params: UnassignContributorFromGithubIssueParams,
) {
  const { assignee, installation, issue, repository } = params

  if (!installation) {
    return
  }

  if (!assignee) {
    return
  }

  const organization = await dbClient
    .selectFrom('homie.organization')
    .innerJoin(
      'github.organization',
      'github.organization.organization_id',
      'homie.organization.id',
    )
    .where('ext_gh_install_id', '=', installation?.id!)
    .select(['homie.organization.id', 'github.organization.ext_gh_install_id'])
    .executeTakeFirst()

  if (!organization) {
    return
  }

  const task = await dbClient
    .selectFrom('homie.task')
    .select(['id'])
    .where('ext_gh_issue_id', '=', issue.id.toString())
    .executeTakeFirst()

  // Create a task here if one doesn't exist here
  if (!task) {
    await dispatch('create_task_from_github_issue', {
      issue,
      installation,
      repository,
    })
    return
  }

  await dbClient.transaction().execute(async (trx) => {
    const contributor = await trx
      .insertInto('homie.contributor')
      .values({
        ext_gh_user_id: assignee.id,
        organization_id: organization.id,
        username: assignee.login ?? '',
      })
      .onConflict((oc) =>
        oc.column('ext_gh_user_id').doUpdateSet({
          organization_id: organization.id,
          username: assignee?.login ?? '',
        }),
      )
      .returning('id')
      .executeTakeFirstOrThrow()

    // Remove assignment
    await trx
      .deleteFrom('homie.contributor_task')
      .where('homie.contributor_task.task_id', '=', task.id)
      .where('homie.contributor_task.contributor_id', '=', contributor.id)
      .executeTakeFirstOrThrow()
  })
}

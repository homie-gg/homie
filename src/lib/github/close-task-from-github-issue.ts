import { dbClient } from '@/database/client'
import { taskStatus } from '@/lib/tasks'
import { InstallationLite, Issue, User } from '@octokit/webhooks-types'

interface CloseTaskFromGithubIssueParams {
  issue: Issue
  installation?: InstallationLite | undefined
}

export async function closeTaskFromGithubIssue(
  params: CloseTaskFromGithubIssueParams,
) {
  const { assignee, installation, issue } = params

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
    .where('ext_gh_issue_id', '=', issue.id)
    .executeTakeFirst()

  if (!task) {
    return
  }

  await dbClient
    .updateTable('homie.task')
    .where('id', '=', task.id)
    .set({
      task_status_id: taskStatus.done,
    })
    .executeTakeFirstOrThrow()
}

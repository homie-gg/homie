import { dbClient } from '@/database/client'
import { embedTask } from '@/lib/ai/embed-task'
import { taskStatus } from '@/lib/tasks'
import { InstallationLite, Issue } from '@octokit/webhooks-types'

interface CloseTaskFromGithubIssueParams {
  issue: Issue
  installation?: InstallationLite | undefined
}

export async function closeTaskFromGithubIssue(
  params: CloseTaskFromGithubIssueParams,
) {
  const { installation, issue } = params

  if (!installation) {
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

  if (!task) {
    return
  }

  const updatedTask = await dbClient
    .updateTable('homie.task')
    .where('id', '=', task.id)
    .set({
      task_status_id: taskStatus.done,
      completed_at: new Date(),
    })
    .returning([
      'id',
      'name',
      'description',
      'task_status_id',
      'task_type_id',
      'html_url',
      'due_date',
      'completed_at',
      'priority_level',
      'organization_id',
      'created_at',
    ])
    .executeTakeFirstOrThrow()

  await embedTask({ task: updatedTask })
}

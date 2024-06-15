import { UpdateTaskFromGithubIssue } from '@/queue/jobs'
import { dbClient } from '@/database/client'
import { classifyTask } from '@/lib/ai/clasify-task'
import { dispatch } from '@/queue/default-queue'

export async function handleUpdateTaskFromGithubIssue(
  job: UpdateTaskFromGithubIssue,
) {
  const { issue, installation } = job.data

  const organization = await dbClient
    .selectFrom('homie.organization')
    .innerJoin(
      'github.organization',
      'github.organization.organization_id',
      'homie.organization.id',
    )
    .where('ext_gh_install_id', '=', installation?.id!)
    .select([
      'homie.organization.id',
      'github.organization.ext_gh_install_id',
      'has_unlimited_usage',
    ])
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
    await dispatch('create_task_from_github_issue', {
      issue,
      installation,
    })
    return
  }

  const { task_type_id, priority_level } = await classifyTask({
    title: issue.title,
    description: issue.body ?? '',
  })

  dbClient
    .updateTable('homie.task')
    .where('id', '=', task.id)
    .set({
      name: issue.title,
      description: issue.body ?? '',
      priority_level,
      task_type_id,
    })
}

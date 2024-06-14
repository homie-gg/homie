import { CreateTaskFromGithubIssue } from '@/queue/jobs'
import { dbClient } from '@/database/client'
import { classifyTask } from '@/lib/ai/clasify-task'
import { createTaskFromGithubIssue } from '@/lib/github/create-task-from-github-issue'

export async function handleCreateTaskFromGithubIssue(
  job: CreateTaskFromGithubIssue,
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

  const { task_type_id, priority_level } = await classifyTask({
    title: issue.title,
    description: issue.body ?? '',
  })

  await createTaskFromGithubIssue({
    issue,
    task_type_id,
    priority_level,
    organization,
  })
}

import { CreateTaskFromGithubIssue } from '@/queue/jobs'
import { dbClient } from '@/database/client'
import { taskStatus } from '@/lib/tasks'
import { classifyTask } from '@/lib/ai/clasify-task'

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

  await dbClient.transaction().execute(async (trx) => {
    const task = await trx
      .insertInto('homie.task')
      .values({
        name: issue.title,
        description: issue.body ?? '',
        html_url: issue.html_url,
        organization_id: organization.id,
        task_status_id: taskStatus.open,
        priority_level,
        task_type_id,
        ext_gh_issue_id: issue.id,
      })
      .returning(['id'])
      .executeTakeFirstOrThrow()

    // Save person who made issue
    await trx
      .insertInto('homie.contributor')
      .values({
        ext_gh_user_id: issue.user.id,
        organization_id: organization.id,
        username: issue.user.login ?? '',
      })
      .onConflict((oc) =>
        oc.column('ext_gh_user_id').doUpdateSet({
          organization_id: organization.id,
          username: issue.user?.login ?? '',
        }),
      )
      .returning('id')
      .executeTakeFirstOrThrow()

    for (const assignee of issue.assignees) {
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
      await trx
        .insertInto('homie.contributor_task')
        .values({
          task_id: task.id,
          contributor_id: contributor.id,
        })
        .executeTakeFirstOrThrow()
    }
  })
}

import { CreateHomieTaskFromGithubIssue } from '@/queue/jobs'
import { dbClient } from '@/database/client'
import { classifyTask } from '@/lib/ai/clasify-task'
import { taskStatus } from '@/lib/tasks'
import { embedTask } from '@/lib/ai/embed-task'
import { dispatch } from '@/queue/default-queue'

export async function handleCreateHomieTaskFromGithubIssue(
  job: CreateHomieTaskFromGithubIssue,
) {
  const { issue, installation, repository } = job.data

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

  const owner = repository.full_name.split('/')[0]

  await dbClient.transaction().execute(async (trx) => {
    const githubRepo = await trx
      .insertInto('github.repo')
      .values({
        organization_id: organization.id,
        owner,
        name: repository.name,
        html_url: repository.html_url,
        ext_gh_repo_id: repository.id,
      })
      .onConflict((oc) =>
        oc.column('ext_gh_repo_id').doUpdateSet({
          organization_id: organization.id,
          name: repository.name,
          owner,
          html_url: repository.html_url,
        }),
      )
      .returning('id')
      .executeTakeFirstOrThrow()

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
        ext_gh_issue_id: issue.id.toString(),
        ext_gh_issue_number: issue.number,
        github_repo_id: githubRepo.id,
      })
      .onConflict((oc) =>
        oc.column('ext_gh_issue_id').doUpdateSet({
          name: issue.title,
          description: issue.body ?? '',
          html_url: issue.html_url,
          organization_id: organization.id,
          task_status_id: taskStatus.open,
          priority_level,
          task_type_id,
          ext_gh_issue_number: issue.number,
          github_repo_id: githubRepo.id,
        }),
      )
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
        'ext_gh_issue_id',
        'ext_gh_issue_number',
        'github_repo_id',
        'ext_asana_task_id',
      ])
      .executeTakeFirstOrThrow()

    await embedTask({ task })

    await dispatch('check_for_duplicate_task', {
      task,
    })

    // Save person who made issue
    if (issue.user) {
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
    }

    if (!issue.assignees) {
      return
    }

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
        .onConflict((oc) => {
          return oc.columns(['contributor_id', 'task_id']).doNothing()
        })
        .executeTakeFirstOrThrow()
    }
  })
}

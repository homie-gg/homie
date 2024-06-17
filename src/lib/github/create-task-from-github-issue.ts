import { dbClient } from '@/database/client'
import { taskStatus } from '@/lib/tasks'

interface CreateTaskFromGithubIssueParams {
  issue: {
    id: number
    number: number
    title: string
    body?: string | null
    user?: {
      id: number
      login?: string
    } | null
    html_url: string
    assignees?:
      | null
      | {
          login?: string | null
          id: number
        }[]
  }
  priority_level: number
  task_type_id: number
  organization: {
    id: number
  }
  repository: {
    name: string
    full_name: string
    html_url: string
    id: number
  }
}

export async function createTaskFromGithubIssue(
  params: CreateTaskFromGithubIssueParams,
) {
  const { issue, organization, priority_level, task_type_id, repository } =
    params

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
      .returning(['id'])
      .executeTakeFirstOrThrow()

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

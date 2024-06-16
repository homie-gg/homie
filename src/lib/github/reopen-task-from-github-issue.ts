import { dbClient } from '@/database/client'
import { taskStatus } from '@/lib/tasks'
import { dispatch } from '@/queue/default-queue'
import { InstallationLite, Issue, Repository } from '@octokit/webhooks-types'

interface ReopenTaskFromGithubIssueParams {
  issue: Issue
  installation?: InstallationLite | undefined
  repository: Repository
}

export async function reopenTaskFromGithubIssue(
  params: ReopenTaskFromGithubIssueParams,
) {
  const { installation, issue, repository } = params

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
    .where('ext_gh_issue_id', '=', issue.id)
    .executeTakeFirst()

  if (!task) {
    await dispatch('create_task_from_github_issue', {
      issue,
      installation,
      repository,
    })

    return
  }

  await dbClient
    .updateTable('homie.task')
    .where('id', '=', task.id)
    .set({
      task_status_id: taskStatus.open,
      completed_at: null,
    })
    .executeTakeFirstOrThrow()
}

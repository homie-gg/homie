import { createJob } from '@/queue/create-job'
import { dbClient } from '@/database/client'
import { classifyTask } from '@/lib/ai/classify-task'
import { embedTask } from '@/lib/ai/embed-task'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { InstallationLite, Repository, Issue } from '@octokit/webhooks-types'
import { createHomieTaskFromGithubIssue } from '@/queue/jobs/create-homie-task-from-github-issue'
import { checkForDuplicateTask } from '@/queue/jobs/check-for-duplicate-task'
import { setTaskComplexity } from '@/queue/jobs/calculate-task-complexity'
import { sendSimilarPullRequestsForTask } from '@/queue/jobs/send-similar-pull-requests-for-task'

export const updateHomieTaskFromGithubIssue = createJob({
  id: 'update_homie_task_from_github_issue',
  handle: async (payload: {
    issue: Issue
    installation: InstallationLite | undefined
    repository: Repository
  }) => {
    const { issue, installation, repository } = payload

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
      .where('ext_gh_issue_id', '=', issue.id.toString())
      .executeTakeFirst()

    if (!task) {
      await createHomieTaskFromGithubIssue.dispatch({
        issue,
        installation,
        repository,
      })
      return
    }

    const { task_type_id, priority_level } = await classifyTask({
      title: issue.title,
      description: issue.body ?? '',
      logData: {
        organization: getOrganizationLogData(organization),
      },
    })

    const updatedTask = await dbClient
      .updateTable('homie.task')
      .where('id', '=', task.id)
      .set({
        name: issue.title,
        description: issue.body ?? '',
        priority_level,
        task_type_id,
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
        'created_at',
        'organization_id',
        'github_repo_id',
        'ext_gh_issue_number',
        'ext_asana_task_id',
        'ext_trello_card_id',
      ])
      .executeTakeFirstOrThrow()

    await checkForDuplicateTask.dispatch(
      {
        task: updatedTask,
      },
      {
        debounce: {
          key: `check_duplicate_task:${updatedTask.id}`,
          delaySecs: 600,
        },
      },
    )

    await setTaskComplexity.dispatch(
      {
        task: updatedTask,
      },
      {
        debounce: {
          key: `calculate_task_complexity:${updatedTask.id}`,
          delaySecs: 600,
        },
      },
    )

    await sendSimilarPullRequestsForTask.dispatch(
      {
        task: updatedTask,
      },
      {
        debounce: {
          key: `send_similar_pull_requests_for_task:${updatedTask.id}`,
          delaySecs: 10800,
        },
      },
    )

    await embedTask({ task: updatedTask })
  },
})

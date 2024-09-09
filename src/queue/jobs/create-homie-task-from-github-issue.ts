import { dbClient } from '@/database/client'
import { classifyTask } from '@/lib/ai/classify-task'
import { taskStatus } from '@/lib/tasks'
import { embedTask } from '@/lib/ai/embed-task'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { createJob } from '@/queue/create-job'
import { setTaskComplexity } from '@/queue/jobs/calculate-task-complexity'
import { checkForDuplicateTask } from '@/queue/jobs/check-for-duplicate-task'
import { sendSimilarPullRequestsForTask } from '@/queue/jobs/send-similar-pull-requests-for-task'

export const createHomieTaskFromGithubIssue = createJob({
  id: 'create_homie_task_from_github_issue',
  handle: async (payload: {
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
    installation?: {
      id: number
    }
    repository: {
      name: string
      full_name: string
      html_url: string
      id: number
    }
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

    const { task_type_id, priority_level } = await classifyTask({
      title: issue.title,
      description: issue.body ?? '',
      logData: {
        organization: getOrganizationLogData(organization),
      },
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
          'ext_trello_card_id',
        ])
        .executeTakeFirstOrThrow()

      await embedTask({ task })

      await checkForDuplicateTask.dispatch(
        {
          task,
        },
        {
          debounce: {
            key: `check_duplicate_task:${task.id}`,
            delaySecs: 600,
          },
        },
      )

      await setTaskComplexity.dispatch(
        {
          task,
        },
        {
          debounce: {
            key: `calculate_task_complexity:${task.id}`,
            delaySecs: 600,
          },
        },
      )

      await sendSimilarPullRequestsForTask.dispatch(
        {
          task,
        },
        {
          debounce: {
            key: `send_similar_pull_requests_for_task:${task.id}`,
            delaySecs: 10800,
          },
        },
      )

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
  },
})

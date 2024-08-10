import { dbClient } from '@/database/client'
import { createAsanaClient } from '@/lib/asana/create-asana-client'
import { createGithubClient } from '@/lib/github/create-github-client'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { setTaskCompleted } from '@/lib/tasks/set-task-completed'
import { createTrelloClient } from '@/lib/trello/create-trello-client'
import { zodFunction } from 'openai/helpers/zod.mjs'
import { z } from 'zod'

interface GetMarkTaskAsDoneTool {
  organization: {
    id: number
    ext_gh_install_id: number | null
    trello_access_token: string | null
    ext_trello_done_task_list_id: string | null
    asana_access_token: string | null
  }
  answerId: string
}

export function getMarkTaskAsDoneTool(params: GetMarkTaskAsDoneTool) {
  const { organization, answerId } = params

  return zodFunction({
    name: 'mark_task_as_done',
    description: 'Marks a given task as done.',
    parameters: z.object({
      task_id: z.number().describe('Task ID for the task to mark as done.'),
    }),
    function: async (args) => {
      const { task_id } = args
      logger.debug('Call - Mark Task Done', {
        event: 'get_answer:mark_task_done:call',
        answer_id: answerId,
        organization: getOrganizationLogData(organization),
        task_id,
      })

      try {
        const task = await dbClient
          .selectFrom('homie.task')
          .leftJoin(
            'github.repo',
            'homie.task.github_repo_id',
            'github.repo.id',
          )
          .where('homie.task.id', '=', task_id)
          .where('homie.task.organization_id', '=', organization.id)
          .select([
            'homie.task.id as task_id',
            'homie.task.name as task_name',
            'homie.task.html_url as task_html_url',
            'homie.task.ext_gh_issue_number as task_ext_gh_issue_number',
            'homie.task.ext_trello_card_id as task_ext_trello_card_id',
            'homie.task.ext_asana_task_id as task_ext_asana_task_id',
            'github.repo.name as github_repo_name',
            'github.repo.owner as github_repo_owner',
          ])
          .executeTakeFirst()

        if (!task) {
          logger.debug('Missing task', {
            event: 'get_answer:mark_task_done:missing_task',
            answer_id: answerId,
            organization: getOrganizationLogData(organization),
            task_id,
          })

          return 'Something went wrong. Could not find task to mark as done.'
        }

        if (
          task.github_repo_name &&
          task.github_repo_owner &&
          organization.ext_gh_install_id &&
          task.task_ext_gh_issue_number
        ) {
          const github = await createGithubClient({
            installationId: organization.ext_gh_install_id,
          })

          await github.rest.issues.update({
            owner: task.github_repo_owner,
            repo: task.github_repo_name,
            state: 'closed',
            issue_number: task.task_ext_gh_issue_number,
          })

          logger.debug('Closed GitHub issue', {
            event: 'get_answer:mark_task_done:closed_github_issue',
            answer_id: answerId,
            organization: getOrganizationLogData(organization),
            task,
          })

          await setTaskCompleted({
            task_id: task.task_id,
          })

          return 'Successfully marked task as done.'
        }

        if (
          task.task_ext_trello_card_id &&
          organization.trello_access_token &&
          organization.ext_trello_done_task_list_id
        ) {
          const trelloClient = createTrelloClient(
            organization.trello_access_token,
          )

          // Move to done list
          await trelloClient.put(`/cards/${task.task_ext_trello_card_id}`, {
            idList: organization.ext_trello_done_task_list_id,
          })

          logger.debug('Moved Trello card to done list', {
            event: 'get_answer:mark_task_done:moved_trello_done',
            answer_id: answerId,
            organization: getOrganizationLogData(organization),
            task,
          })

          await setTaskCompleted({
            task_id: task.task_id,
          })

          return 'Successfully marked task as done.'
        }

        if (task.task_ext_asana_task_id && organization.asana_access_token) {
          const asana = createAsanaClient(organization.asana_access_token)

          await asana.put(`/tasks/${task.task_ext_asana_task_id}`, {
            data: {
              completed: true,
            },
          })

          logger.debug('Marked Asana task as complete', {
            event: 'get_answer:mark_task_done:marked_asana_complete',
            answer_id: answerId,
            organization: getOrganizationLogData(organization),
            task,
          })

          await setTaskCompleted({
            task_id: task.task_id,
          })

          return 'Successfully marked task as done.'
        }

        return 'Failed - no task integration.'
      } catch (error) {
        logger.debug('Failed to mark done', {
          event: 'get_answer:mark_task_done:failed',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          task_id,
          error,
        })
        return 'FAILED'
      }
    },
  })
}

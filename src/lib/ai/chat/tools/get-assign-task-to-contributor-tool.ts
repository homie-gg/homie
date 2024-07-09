import { dbClient } from '@/database/client'
import { createAsanaClient } from '@/lib/asana/create-asana-client'
import { createGithubClient } from '@/lib/github/create-github-client'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { assignContributorToTask } from '@/lib/tasks/assign-contributor-to-task'
import { createTrelloClient } from '@/lib/trello/create-trello-client'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

interface GetAssignTaskToContributorTool {
  organization: {
    id: number
    ext_gh_install_id: number | null
    trello_access_token: string | null
    ext_trello_done_task_list_id: string | null
    asana_access_token: string | null
  }
  answerId: string
}

export function getAssignTaskToContributorTool(
  params: GetAssignTaskToContributorTool,
) {
  const { organization, answerId } = params
  return new DynamicStructuredTool({
    name: 'assign_task_to_contributor',
    description: 'Assigns a task to a given contributor.',
    schema: z.object({
      task_id: z.number().describe('Task ID for the task to assign'),
      ext_slack_member_id: z
        .string()
        .describe("Slack ID for the target contributor starting with a '@'."),
    }),
    func: async (params) => {
      const { ext_slack_member_id, task_id } = params

      logger.debug('Call - Assign Task To Contributor', {
        event: 'get_answer:assign_task_to_contributor:call',
        answer_id: answerId,
        organization: getOrganizationLogData(organization),
      })

      try {
        const contributor = await dbClient
          .selectFrom('homie.contributor')
          .where(
            'ext_slack_member_id',
            '=',
            ext_slack_member_id.replace('@', ''),
          )
          .where('organization_id', '=', organization.id)
          .select([
            'id',
            'username',
            'ext_trello_member_id',
            'ext_asana_user_id',
          ])
          .executeTakeFirst()

        if (!contributor) {
          logger.debug('Missing contributor', {
            event: 'get_answer:assign_task_to_contributor:missing_contributor',
            answer_id: answerId,
            organization: getOrganizationLogData(organization),
          })
          return 'Could not find contributor. Was one mapped in settings?'
        }

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
            event: 'get_answer:assign_task_to_contributor:missing_task',
            answer_id: answerId,
            organization: getOrganizationLogData(organization),
            contributor,
          })
          return 'Something went wrong. Could not find task to assign.'
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
          await github.rest.issues.addAssignees({
            assignees: [contributor.username],
            owner: task.github_repo_owner,
            repo: task.github_repo_name,
            issue_number: task.task_ext_gh_issue_number,
          })

          logger.debug('Assigned GitHub issue', {
            event:
              'get_answer:assign_task_to_contributor:assigned_github_issue',
            answer_id: answerId,
            organization: getOrganizationLogData(organization),
            contributor,
            task,
          })

          await assignContributorToTask({
            task_id: task.task_id,
            contributor_id: contributor.id,
          })

          return 'Successfully assigned task to contributor.'
        }

        if (
          task.task_ext_trello_card_id &&
          contributor.ext_trello_member_id &&
          organization.trello_access_token &&
          organization.ext_trello_done_task_list_id
        ) {
          const trelloClient = createTrelloClient(
            organization.trello_access_token,
          )

          // Assign member to card
          await trelloClient.post(
            `/cards/${task.task_ext_trello_card_id}/idMembers?value=${contributor.ext_trello_member_id}`,
            {},
          )

          logger.debug('Assigned Trello task', {
            event: 'get_answer:assign_task_to_contributor:assigned_trello_task',
            answer_id: answerId,
            organization: getOrganizationLogData(organization),
            contributor,
            task,
          })

          await assignContributorToTask({
            task_id: task.task_id,
            contributor_id: contributor.id,
          })

          return 'Successfully assigned task to contributor.'
        }

        if (
          task.task_ext_asana_task_id &&
          contributor.ext_asana_user_id &&
          organization.asana_access_token
        ) {
          const asana = createAsanaClient(organization.asana_access_token)

          await asana.put(`/tasks/${task.task_ext_asana_task_id}`, {
            data: {
              assignee: contributor.ext_asana_user_id,
            },
          })

          logger.debug('Assigned Asana task', {
            event: 'get_answer:assign_task_to_contributor:assigned_asana_task',
            answer_id: answerId,
            organization: getOrganizationLogData(organization),
            contributor,
            task,
          })

          await assignContributorToTask({
            task_id: task.task_id,
            contributor_id: contributor.id,
          })

          return 'Successfully assigned task to contributor.'
        }

        return 'Failed - no task integration'
      } catch (error) {
        logger.debug('Failed to assign task', {
          event: 'get_answer:assign_task_to_contributor:failed',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          error,
        })

        return 'FAILED'
      }
    },
  })
}

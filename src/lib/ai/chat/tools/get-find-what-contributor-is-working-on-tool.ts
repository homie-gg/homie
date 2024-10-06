import { dbClient } from '@/database/client'
import { taskStatus } from '@/lib/tasks'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { subBusinessDays } from 'date-fns'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'

interface GetFindWhatContributorIsWorkingOnTool {
  organization: {
    id: number
  }
  answerID: string
}

export function getFindWhatContributorIsWorkingOnTool(
  params: GetFindWhatContributorIsWorkingOnTool,
) {
  const { organization, answerID: answerId } = params
  return new DynamicStructuredTool({
    name: 'find_what_contributor_is_working_on',
    description: 'Find what a contributor is working on.',
    schema: z.object({
      ext_slack_member_id: z
        .string()
        .describe("Slack ID for the target user starting with a '@'."),
    }),
    func: async ({ ext_slack_member_id }) => {
      logger.debug('Call - Find What Contributor Is Working On', {
        event: 'get_answer:find_what_contributor_is_working_on:call',
        answer_id: answerId,
        organization: getOrganizationLogData(organization),
        ext_slack_member_id,
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
          .select(['id'])
          .executeTakeFirst()

        if (!contributor) {
          logger.debug(
            `Missing contributor with slack id: ${ext_slack_member_id}`,
            {
              event:
                'get_answer:find_what_contributor_is_working_on:missing_contributor',
              answer_id: answerId,
              organization: getOrganizationLogData(organization),
              ext_slack_member_id,
            },
          )
          return 'Could not find contributor. Was one mapped in settings?'
        }

        const recentPrs = await dbClient
          .selectFrom('homie.pull_request')
          .innerJoin(
            'homie.contributor',
            'homie.contributor.id',
            'homie.pull_request.contributor_id',
          )
          .where('contributor_id', '=', contributor.id)
          .where('merged_at', 'is not', null)
          .where('merged_at', '>', subBusinessDays(new Date(), 3))
          .select(['title', 'body', 'username', 'merged_at', 'html_url'])
          .execute()

        const assignedTasks = await dbClient
          .selectFrom('homie.task')
          .innerJoin(
            'homie.contributor_task',
            'homie.contributor_task.task_id',
            'homie.task.id',
          )
          .where('homie.contributor_task.contributor_id', '=', contributor.id)
          .where('homie.task.task_status_id', '=', taskStatus.open)
          .select(['name', 'description', 'html_url'])
          .execute()

        if (recentPrs.length === 0 && assignedTasks.length === 0) {
          logger.debug('No PRs or Tasks found for Contributor', {
            event: 'get_answer:find_what_contributor_is_working_on:empty',
            answer_id: answerId,
            organization: getOrganizationLogData(organization),
            ext_slack_member_id,
            contributor,
          })

          return 'No recent Pull Requests. No currently assigned tasks.'
        }

        if (recentPrs.length === 0) {
          logger.debug('Found tasks and PRs for contributor', {
            event: 'get_answer:find_what_contributor_is_working_on:result',
            answer_id: answerId,
            organization: getOrganizationLogData(organization),
            ext_slack_member_id,
            recent_prs: recentPrs,
            assigned_tasks: assignedTasks,
          })

          return [
            'No recent Pull Requests.\n',
            'Currently assigned tasks:',
            ...assignedTasks.map(
              (task) =>
                `- [${task.name}](${task.html_url}): ${task.description}`,
            ),
          ].join('\n')
        }

        if (assignedTasks.length === 0) {
          logger.debug('Found tasks and PRs for contributor', {
            event: 'get_answer:find_what_contributor_is_working_on:result',
            answer_id: answerId,
            organization: getOrganizationLogData(organization),
            ext_slack_member_id,
            recent_prs: recentPrs,
            assigned_tasks: assignedTasks,
          })

          return [
            'No currently assigned tasks.\n',
            'Recently merged Pull Requests:',
            ...recentPrs.map(
              (pullRequest) =>
                `- [${pullRequest.title}](${pullRequest.html_url}) - ${pullRequest.body} (merged at ${pullRequest.merged_at})`,
            ),
          ].join('\n')
        }

        logger.debug('Found tasks and PRs for contributor', {
          event: 'get_answer:find_what_contributor_is_working_on:result',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          ext_slack_member_id,
          recent_prs: recentPrs,
          assigned_tasks: assignedTasks,
        })

        return [
          'Currently assigned tasks:',
          ...assignedTasks.map(
            (task) => `- [${task.name}](${task.html_url}): ${task.description}`,
          ),
          'And here are some merged Pull Requests:',
          ...recentPrs.map(
            (pullRequest) =>
              `- [${pullRequest.title}](${pullRequest.html_url}) - ${pullRequest.body} (merged at ${pullRequest.merged_at})`,
          ),
        ].join('\n')
      } catch (error) {
        logger.debug(
          'Get Answer - Find What Contributor Is Working On - Failed',
          {
            event: 'get_answer:find_what_contributor_is_working_on:failed',
            answer_id: answerId,
            organization: getOrganizationLogData(organization),
            ext_slack_member_id,
            error,
          },
        )

        return 'FAILED'
      }
    },
  })
}

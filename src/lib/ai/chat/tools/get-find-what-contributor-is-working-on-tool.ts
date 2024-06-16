import { dbClient } from '@/database/client'
import { taskStatus } from '@/lib/tasks'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { subBusinessDays } from 'date-fns'

interface GetFindWhatContributorIsWorkingOnTool {
  organization: {
    id: number
  }
}

export function getFindWhatContributorIsWorkingOnTool(
  params: GetFindWhatContributorIsWorkingOnTool,
) {
  const { organization } = params
  return new DynamicStructuredTool({
    name: 'find_what_contributor_is_working_on',
    description: 'Find what a contributor is working on.',
    schema: z.object({
      ext_slack_member_id: z
        .string()
        .describe("Slack ID for the target user starting with a '@'."),
    }),
    func: async (params) => {
      const contributor = await dbClient
        .selectFrom('homie.contributor')
        .where(
          'ext_slack_member_id',
          '=',
          params.ext_slack_member_id.replace('@', ''),
        )
        .where('organization_id', '=', organization.id)
        .select(['id'])
        .executeTakeFirst()

      if (!contributor) {
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
        return 'No recent Pull Requests. No currently assigned tasks.'
      }

      if (recentPrs.length === 0) {
        return [
          'No recent Pull Requests.\n',
          'Currently assigned tasks:',
          ...assignedTasks.map(
            (task) =>
              `- [${task.name}](${task.html_url}) - ${task.description}`,
          ),
        ].join('\n')
      }

      if (assignedTasks.length === 0) {
        return [
          'No currently assigned tasks.\n',
          'Recently merged Pull Requests:',
          ...recentPrs.map(
            (pullRequest) =>
              `- [${pullRequest.title}](${pullRequest.html_url}) - ${pullRequest.body} (merged at ${pullRequest.merged_at})`,
          ),
        ].join('\n')
      }

      return [
        'Currently assigned tasks:',
        ...assignedTasks.map(
          (task) => `- [${task.name}](${task.html_url}) - ${task.description}`,
        ),
        'And here are some merged Pull Requests:',
        ...recentPrs.map(
          (pullRequest) =>
            `- [${pullRequest.title}](${pullRequest.html_url}) - ${pullRequest.body} (merged at ${pullRequest.merged_at})`,
        ),
      ].join('\n')
    },
  })
}

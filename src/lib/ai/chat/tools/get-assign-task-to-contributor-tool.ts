import { dbClient } from '@/database/client'
import { createGithubClient } from '@/lib/github/create-github-client'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

interface GetAssignTaskToContributorTool {
  organization: {
    id: number
    ext_gh_install_id: number | null
  }
}

export function getAssignTaskToContributorTool(
  params: GetAssignTaskToContributorTool,
) {
  const { organization } = params
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

      const contributor = await dbClient
        .selectFrom('homie.contributor')
        .where('ext_slack_member_id', '=', ext_slack_member_id.replace('@', ''))
        .where('organization_id', '=', organization.id)
        .select(['id', 'username'])
        .executeTakeFirst()

      if (!contributor) {
        return 'Could not find contributor. Was one mapped in settings?'
      }

      const task = await dbClient
        .selectFrom('homie.task')
        .innerJoin('github.repo', 'homie.task.github_repo_id', 'github.repo.id')
        .where('homie.task.id', '=', task_id)
        .where('homie.task.organization_id', '=', organization.id)
        .select([
          'homie.task.id as task_id',
          'homie.task.name as task_name',
          'homie.task.html_url as task_html_url',
          'homie.task.ext_gh_issue_number as task_ext_gh_issue_number',
          'github.repo.name as repo_name',
          'github.repo.owner as repo_owner',
        ])
        .executeTakeFirst()

      if (!task) {
        return 'Something went wrong. Could not find task to assign.'
      }

      if (!organization.ext_gh_install_id) {
        return 'Could not assign task. Missing GitHub install.'
      }

      if (!task.repo_owner) {
        return 'Could not assign task. Missing GitHub repo owner.'
      }

      if (!task.task_ext_gh_issue_number) {
        return 'Could not assign task. Missing GitHub issue number.'
      }

      const github = await createGithubClient({
        installationId: organization.ext_gh_install_id,
      })
      await github.rest.issues.addAssignees({
        assignees: [contributor.username],
        owner: task.repo_owner,
        repo: task.repo_name,
        issue_number: task.task_ext_gh_issue_number,
      })

      await dbClient
        .insertInto('homie.contributor_task')
        .values({
          task_id: task.task_id,
          contributor_id: contributor.id,
        })
        .onConflict((oc) => {
          return oc.columns(['contributor_id', 'task_id']).doNothing()
        })
        .executeTakeFirstOrThrow()

      return 'Successfully assigned'
    },
  })
}

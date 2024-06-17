import { dbClient } from '@/database/client'
import { createGithubClient } from '@/lib/github/create-github-client'
import { taskStatus } from '@/lib/tasks'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

interface GetMarkTaskAsDoneTool {
  organization: {
    id: number
    ext_gh_install_id: number | null
  }
}

export function getMarkTaskAsDoneTool(params: GetMarkTaskAsDoneTool) {
  const { organization } = params
  return new DynamicStructuredTool({
    name: 'mark_task_as_done',
    description: 'Marks a given task as done.',
    schema: z.object({
      task_id: z.number().describe('Task ID for the task to mark as done.'),
    }),
    func: async (params) => {
      const { task_id } = params

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
        return 'Something went wrong. Could not find task to mark as done.'
      }

      if (!organization.ext_gh_install_id) {
        return 'Could not mark task as done. Missing GitHub install.'
      }

      if (!task.repo_owner) {
        return 'Could not mark task as done. Missing GitHub repo owner.'
      }

      if (!task.task_ext_gh_issue_number) {
        return 'Could not mark task as done. Missing GitHub issue number.'
      }

      const github = await createGithubClient({
        installationId: organization.ext_gh_install_id,
      })

      await github.rest.issues.update({
        owner: task.repo_owner,
        repo: task.repo_name,
        state: 'closed',
        issue_number: task.task_ext_gh_issue_number,
      })

      await dbClient
        .updateTable('homie.task')
        .where('id', '=', task.task_id)
        .set({
          task_status_id: taskStatus.done,
          completed_at: new Date(),
        })
        .executeTakeFirstOrThrow()

      return 'Successfully marked task as done.'
    },
  })
}

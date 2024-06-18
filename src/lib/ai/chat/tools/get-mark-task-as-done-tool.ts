import { dbClient } from '@/database/client'
import { createGithubClient } from '@/lib/github/create-github-client'
import { taskStatus } from '@/lib/tasks'
import { createTrelloClient } from '@/lib/trello/create-trello-client'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

interface GetMarkTaskAsDoneTool {
  organization: {
    id: number
    ext_gh_install_id: number | null
    trello_access_token: string | null
    ext_trello_done_task_list_id: string | null
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
        .leftJoin('github.repo', 'homie.task.github_repo_id', 'github.repo.id')
        .where('homie.task.id', '=', task_id)
        .where('homie.task.organization_id', '=', organization.id)
        .select([
          'homie.task.id as task_id',
          'homie.task.name as task_name',
          'homie.task.html_url as task_html_url',
          'homie.task.ext_gh_issue_number as task_ext_gh_issue_number',
          'homie.task.ext_trello_card_id as task_ext_trello_card_id',
          'github.repo.name as github_repo_name',
          'github.repo.owner as github_repo_owner',
        ])
        .executeTakeFirst()

      if (!task) {
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
      }

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

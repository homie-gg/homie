import { createJob } from '@/queue/create-job'
import { dbClient } from '@/database/client'
import { classifyTask } from '@/lib/ai/classify-task'
import { taskStatus } from '@/lib/tasks'
import { embedTask } from '@/lib/ai/embed-task'
import { dispatch } from '@/queue/dispatch'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'

export const createHomieTaskFromTrelloTask = createJob({
  id: 'create_homie_task_from_trello_task',
  handle: async (payload: {
    board: {
      id: string
    }
    card: {
      id: string
      idList?: string
      shortLink: string
      name: string
    }
  }) => {
    const { board, card } = payload

    const trelloWorkspace = await dbClient
      .selectFrom('trello.workspace')
      .where('ext_trello_board_id', '=', board.id)
      .select([
        'trello_access_token',
        'organization_id',
        'ext_trello_done_task_list_id',
      ])
      .executeTakeFirst()

    if (!trelloWorkspace) {
      return
    }

    const organization = await dbClient
      .selectFrom('homie.organization')
      .where('id', '=', trelloWorkspace.organization_id)
      .select(['id'])
      .executeTakeFirst()

    if (!organization) {
      return
    }

    const { task_type_id, priority_level } = await classifyTask({
      title: card.name,
      description: '',
      logData: {
        organization: getOrganizationLogData(organization),
      },
    })

    const isDone = card.idList
      ? card.idList === trelloWorkspace.ext_trello_done_task_list_id
      : false

    const task = await dbClient
      .insertInto('homie.task')
      .values({
        name: card.name,
        description: '',
        html_url: `https://trello.com/c/${card.shortLink}`,
        organization_id: organization.id,
        task_status_id: isDone ? taskStatus.done : taskStatus.open,
        priority_level,
        task_type_id,
        ext_trello_card_id: card.id,
      })
      .onConflict((oc) =>
        oc.column('ext_trello_card_id').doUpdateSet({
          name: card.name,
          description: '',
          html_url: `https://trello.com/c/${card.shortLink}`,
          organization_id: organization.id,
          task_status_id: isDone ? taskStatus.done : taskStatus.open,
          priority_level,
          task_type_id,
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

    await dispatch(
      'check_for_duplicate_task',
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

    await dispatch(
      'calculate_task_complexity',
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

    await dispatch(
      'send_similar_pull_requests_for_task',
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
  },
})

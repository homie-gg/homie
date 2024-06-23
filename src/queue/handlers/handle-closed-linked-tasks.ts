import { dbClient } from '@/database/client'
import { CloseLinkedTasks } from '@/queue/jobs'
import { closeLinkedTrelloTasks } from '@/lib/trello/close-linked-trello-tasks'
import { closeLinkedAsanaTasks } from '@/lib/asana/close-linked-asana-tasks'

export async function handleCloseLinkedTasks(job: CloseLinkedTasks) {
  const { pullRequestBody, organization } = job.data

  const organizationWithBilling = await dbClient
    .selectFrom('homie.organization')
    .leftJoin(
      'homie.subscription',
      'homie.subscription.organization_id',
      'homie.organization.id',
    )
    .leftJoin('homie.plan', 'homie.plan.id', 'homie.subscription.plan_id')
    .leftJoin(
      'trello.workspace',
      'trello.workspace.organization_id',
      'homie.organization.id',
    )
    .where('homie.organization.id', '=', organization.id)
    .select(['homie.organization.id', 'has_unlimited_usage'])
    .executeTakeFirst()

  if (!organizationWithBilling) {
    return
  }

  if (!pullRequestBody) {
    return
  }

  const trelloWorkspace = await dbClient
    .selectFrom('trello.workspace')
    .where('organization_id', '=', organizationWithBilling.id)
    .select(['ext_trello_done_task_list_id', 'trello_access_token'])
    .executeTakeFirst()

  if (trelloWorkspace) {
    await closeLinkedTrelloTasks({
      pullRequestBody,
      trelloWorkspace,
    })
  }

  const asanaAppUser = await dbClient
    .selectFrom('asana.app_user')
    .where('organization_id', '=', organizationWithBilling.id)
    .select(['asana_access_token'])
    .executeTakeFirst()

  if (asanaAppUser) {
    await closeLinkedAsanaTasks({
      pullRequestBody,
      asanaAppUser,
    })
  }
}

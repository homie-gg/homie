import { dbClient } from '@/database/client'
import { CloseLinkedTasks } from '@/queue/jobs'
import { closeLinkedTrelloTasks } from '@/lib/trello/close-linked-trello-tasks'

export async function handleCloseLinkedTasks(job: CloseLinkedTasks) {
  const { pullRequestBody, organization } = job.data

  const organizationWithBilling = await dbClient
    .selectFrom('voidpm.organization')
    .leftJoin(
      'voidpm.subscription',
      'voidpm.subscription.organization_id',
      'voidpm.organization.id',
    )
    .leftJoin('voidpm.plan', 'voidpm.plan.id', 'voidpm.subscription.plan_id')
    .where('voidpm.organization.id', '=', organization.id)
    .select([
      'voidpm.organization.id',
      'is_over_plan_pr_limit',
      'pr_limit_per_month',
      'has_unlimited_usage',
    ])
    .executeTakeFirst()

  if (!organizationWithBilling) {
    return
  }

  if (
    organizationWithBilling.is_over_plan_pr_limit &&
    !organizationWithBilling.has_unlimited_usage
  ) {
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
}

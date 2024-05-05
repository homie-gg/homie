import { dbClient } from '@/database/client'
import { CloseLinkedTasks } from '@/queue/jobs'
import { closeLinkedTrelloTasks } from '@/lib/trello/close-linked-trello-tasks'

export async function handleCloseLinkedTasks(job: CloseLinkedTasks) {
  const { pull_request, installation } = job.data

  const organization = await dbClient
    .selectFrom('homie.organization')
    .innerJoin(
      'github.organization',
      'github.organization.organization_id',
      'homie.organization.id',
    )
    .leftJoin(
      'homie.subscription',
      'homie.subscription.organization_id',
      'homie.organization.id',
    )
    .leftJoin('homie.plan', 'homie.plan.id', 'homie.subscription.plan_id')
    .where('ext_gh_install_id', '=', installation?.id!)
    .select([
      'homie.organization.id',
      'github.organization.ext_gh_install_id',
      'is_over_plan_pr_limit',
      'pr_limit_per_month',
      'has_unlimited_usage',
    ])
    .executeTakeFirst()

  if (!organization) {
    return
  }

  if (organization.is_over_plan_pr_limit && !organization.has_unlimited_usage) {
    return
  }

  const trelloWorkspace = await dbClient
    .selectFrom('trello.workspace')
    .where('organization_id', '=', organization.id)
    .select(['ext_trello_done_task_list_id', 'trello_access_token'])
    .executeTakeFirst()

  if (trelloWorkspace) {
    await closeLinkedTrelloTasks({
      pullRequest: pull_request,
      trelloWorkspace,
    })
  }
}
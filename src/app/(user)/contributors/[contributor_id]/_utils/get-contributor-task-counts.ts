import { dbClient } from '@/database/client'
import { taskStatus } from '@/lib/tasks'
import { sql } from 'kysely'

interface GetContributorTaskCountsParams {
  organization: {
    id: number
  }
  contributor: {
    id: number
  }
  startDate: Date
  endDate: Date
}

export async function getContributorTaskCounts(
  params: GetContributorTaskCountsParams,
) {
  const { organization, contributor, startDate, endDate } = params

  let baseQuery = dbClient
    .selectFrom('homie.task')
    .innerJoin(
      'homie.contributor_task',
      'homie.contributor_task.task_id',
      'homie.task.id',
    )
    .innerJoin(
      'homie.task_status',
      'homie.task.task_status_id',
      'homie.task_status.id',
    )
    .where('homie.task.created_at', '>=', startDate)
    .where('homie.task.created_at', '<=', endDate)
    .where('homie.contributor_task.contributor_id', '=', contributor.id)
    .where('homie.task.organization_id', '=', organization.id)

  const assigned = await baseQuery
    .select(sql<number>`COUNT(homie.task.id)`.as('count'))
    .executeTakeFirstOrThrow()

  const completed = await baseQuery
    .where('homie.task_status.id', '=', taskStatus.done)
    .select(sql<number>`COUNT(homie.task.id)`.as('count'))
    .executeTakeFirstOrThrow()

  return {
    num_assigned: assigned.count,
    num_completed: completed.count,
  }
}

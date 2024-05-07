import { dbClient } from '@/database/client'
import { startOfMonth } from 'date-fns'
import { sql } from 'kysely'

interface GetIsOverPlanPRLimitParams {
  organization: {
    id: number
  }
  pr_limit_per_month: number | null
}

const freePlanPRLimitPerMonth = 30

export async function getIsOverPlanPRLimit(
  params: GetIsOverPlanPRLimitParams,
): Promise<boolean> {
  const { organization, pr_limit_per_month } = params

  const { pr_count_this_month } = await dbClient
    .selectFrom('voidpm.pull_request')
    .where('organization_id', '=', organization.id)
    .where('created_at', '>=', startOfMonth(new Date()))
    .select(sql<number>`count(*)`.as('pr_count_this_month'))
    .executeTakeFirstOrThrow()

  const planPRLimit = pr_limit_per_month ?? freePlanPRLimitPerMonth

  return pr_count_this_month > planPRLimit
}

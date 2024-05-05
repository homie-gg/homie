import { dbClient } from '@/database/client'

export async function handleResetOrganizationsOverPRLimit() {
  await dbClient
    .updateTable('homie.organization')
    .set({
      is_over_plan_pr_limit: false,
    })
    .execute()
}

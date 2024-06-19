import { dbClient } from '@/database/client'

interface GetIsOverPlanContributorLimitParams {
  organization: {
    id: number
  }
}

const freePlanContributorLimit = 3

export async function getIsOverPlanContributorLimit(
  params: GetIsOverPlanContributorLimitParams,
) {
  const { organization } = params

  const organizationWithBilling = await dbClient
    .selectFrom('homie.organization')
    .leftJoin(
      'homie.subscription',
      'homie.subscription.organization_id',
      'homie.organization.id',
    )
    .leftJoin('homie.plan', 'homie.plan.id', 'homie.subscription.plan_id')
    .where('homie.organization.id', '=', organization.id)
    .where('homie.subscription.stripe_status', '=', 'active')
    .select([
      'homie.organization.id',
      'has_unlimited_usage',
      'homie.subscription.quantity as subscription_quantity',
    ])
    .executeTakeFirst()

  if (organizationWithBilling?.has_unlimited_usage) {
    return false
  }

  const contributors = await dbClient
    .selectFrom('homie.contributor')
    .where('organization_id', '=', organization.id)
    .execute()

  const numContributors = contributors.length

  if (!organizationWithBilling?.subscription_quantity) {
    return numContributors > freePlanContributorLimit
  }

  return numContributors > organizationWithBilling.subscription_quantity
}

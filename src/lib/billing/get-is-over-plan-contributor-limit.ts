import { dbClient } from '@/database/client'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { isBefore } from 'date-fns'

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

  logger.debug('Checking over plan contributor limit', {
    event: 'check_over_plan_contributor_limit:start',
    organization: getOrganizationLogData(organization),
  })

  const organizationWithBilling = await dbClient
    .selectFrom('homie.organization')
    .leftJoin(
      'homie.subscription',
      'homie.subscription.organization_id',
      'homie.organization.id',
    )
    .leftJoin('homie.plan', 'homie.plan.id', 'homie.subscription.plan_id')
    .where('homie.organization.id', '=', organization.id)
    .select([
      'homie.organization.id',
      'has_unlimited_usage',
      'homie.subscription.quantity as subscription_quantity',
      'homie.subscription.stripe_status as subscription_stripe_status',
      'homie.plan.name as plan',
      'homie.organization.trial_ends_at',
    ])
    .executeTakeFirst()

  logger.debug('Got org billing info', {
    event: 'check_over_plan_contributor_limit:got_org_with_billing',
    organization: getOrganizationLogData(organization),
    organization_with_billing: organizationWithBilling,
  })

  if (organizationWithBilling?.has_unlimited_usage) {
    logger.debug('Has unlimited usage', {
      event: 'check_over_plan_contributor_limit:has_unlimited_usage',
      organization: getOrganizationLogData(organization),
      organization_with_billing: organizationWithBilling,
    })

    return false
  }

  if (
    organizationWithBilling?.trial_ends_at &&
    isBefore(organizationWithBilling.trial_ends_at, new Date()) // not past ended
  ) {
    logger.debug('Is on trial', {
      event: 'check_over_plan_contributor_limit:on_trial',
      organization: getOrganizationLogData(organization),
      organization_with_billing: organizationWithBilling,
    })

    return false
  }

  const contributors = await dbClient
    .selectFrom('homie.contributor')
    .where('organization_id', '=', organization.id)
    .execute()

  const numContributors = contributors.length

  if (
    organizationWithBilling?.subscription_stripe_status !== 'active' ||
    !organizationWithBilling?.subscription_quantity
  ) {
    const isOverLimit = numContributors > freePlanContributorLimit

    if (isOverLimit) {
      logger.debug('Free plan - over limit', {
        event: 'check_over_plan_contributor_limit:free_plan_over_limit',
        organization: getOrganizationLogData(organization),
        organization_with_billing: organizationWithBilling,
        num_contributors: numContributors,
        free_plan_limit: freePlanContributorLimit,
      })

      return true
    }

    logger.debug('Free plan - under limit', {
      event: 'check_over_plan_contributor_limit:free_plan_under_limit',
      organization: getOrganizationLogData(organization),
      organization_with_billing: organizationWithBilling,
      num_contributors: numContributors,
      free_plan_limit: freePlanContributorLimit,
    })

    return false
  }

  const isOverLimit =
    numContributors > organizationWithBilling.subscription_quantity

  if (isOverLimit) {
    logger.debug('Subscribed - over limit', {
      event: 'check_over_plan_contributor_limit:subscribed_over_limit',
      organization: getOrganizationLogData(organization),
      organization_with_billing: organizationWithBilling,
      num_contributors: numContributors,
      num_seats_subscribed: organizationWithBilling.subscription_quantity,
    })

    return true
  }

  logger.debug('Subscribed - under limit', {
    event: 'check_over_plan_contributor_limit:subscribed_under_limit',
    organization: getOrganizationLogData(organization),
    organization_with_billing: organizationWithBilling,
    num_contributors: numContributors,
    num_seats_subscribed: organizationWithBilling.subscription_quantity,
  })

  return false
}

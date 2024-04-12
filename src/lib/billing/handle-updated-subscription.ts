import { getIsOverPlanPRLimit } from '@/lib/billing/get-is-over-plan-pr-limit'
import { stripeServerClient } from '@/lib/billing/stripe-server-client'
import { dbClient } from '@/lib/db/client'
import { getOrganizationLogData } from '@/lib/log/get-organization-log-data'
import { logger } from '@/lib/log/logger'

interface HandleUpdatedSubscriptionParams {
  ext_stripe_subscription_id: string
  ext_stripe_customer_id: string
}

export async function handleUpdatedSubscription(
  params: HandleUpdatedSubscriptionParams,
) {
  const { ext_stripe_customer_id, ext_stripe_subscription_id } = params

  const organization = await dbClient
    .selectFrom('voidpm.organization')
    .where('ext_stripe_customer_id', '=', ext_stripe_customer_id)
    .selectAll()
    .executeTakeFirst()

  if (!organization) {
    logger.error(
      `Could not find organization with ext_stripe_customer_id: '${ext_stripe_customer_id}'.`,
      {
        event: 'set_subscription.missing_organization',
        ext_stripe_customer_id,
        ext_stripe_subscription_id,
      },
    )
    return
  }

  const stripeSubscription = await stripeServerClient.subscriptions.retrieve(
    ext_stripe_subscription_id,
    {
      expand: ['default_payment_method'],
    },
  )

  const priceId = stripeSubscription.items.data[0].price.id

  const plan = await dbClient
    .selectFrom('voidpm.plan')
    .select(['id', 'pr_limit_per_month'])
    .where('ext_stripe_price_id', '=', priceId)
    .executeTakeFirst()

  if (!plan) {
    logger.error(`Could find plan with id: '${priceId}'`, {
      event: 'set_subscription.missing_plan',
      ext_stripe_customer_id,
      ext_stripe_subscription_id,
      ext_stripe_price_id: priceId,
      organization: getOrganizationLogData(organization),
    })
    return
  }

  const existingSubscription = await dbClient
    .insertInto('voidpm.subscription')
    .values({
      name: 'main',
      ext_stripe_subscription_id: ext_stripe_subscription_id,
      stripe_status: stripeSubscription.status,
      trial_ends_at: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null,
      plan_id: plan.id,
      organization_id: organization.id,
      ends_at: stripeSubscription.cancel_at
        ? new Date(stripeSubscription.cancel_at * 1000)
        : null,
    })
    .onConflict((oc) =>
      oc.column('organization_id').doUpdateSet({
        ext_stripe_subscription_id: ext_stripe_subscription_id,
        stripe_status: stripeSubscription.status,
        trial_ends_at: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000)
          : null,
        ends_at: stripeSubscription.cancel_at
          ? new Date(stripeSubscription.cancel_at * 1000)
          : null,
        plan_id: plan.id,
      }),
    )
    .executeTakeFirst()

  if (!existingSubscription) {
    logger.error('Failed to create subscription.', {
      event: 'set_subscription.missing_organization',
      ext_stripe_customer_id,
      ext_stripe_subscription_id,
      organization: getOrganizationLogData(organization),
    })

    return
  }

  const isOverPlanLimit = await getIsOverPlanPRLimit({
    pr_limit_per_month: plan.pr_limit_per_month,
    organization,
  })

  await dbClient
    .updateTable('voidpm.organization')
    .set({ is_over_plan_pr_limit: isOverPlanLimit })
    .where('id', '=', organization.id)
    .executeTakeFirstOrThrow()

  logger.debug('Created subscription', {
    event: 'set_subscription.success',
    ext_stripe_customer_id,
    ext_stripe_subscription_id,
    organization: getOrganizationLogData(organization),
  })
}

import { stripeServerClient } from '@/lib/billing/stripe-server-client'
import { dbClient } from '@/database/client'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
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
    .selectFrom('homie.organization')
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
    .selectFrom('homie.plan')
    .select(['id'])
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
    .insertInto('homie.subscription')
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

  logger.debug('Created subscription', {
    event: 'set_subscription.success',
    ext_stripe_customer_id,
    ext_stripe_subscription_id,
    organization: getOrganizationLogData(organization),
  })
}

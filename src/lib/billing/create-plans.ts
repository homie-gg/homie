import { dbClient } from '@/lib/db/client'
;(async () => {
  const plans = [
    {
      name: 'basic',
      billing_interval: 'monthly',
      ext_stripe_price_id: process.env.STRIPE_PRICE_ID_VOID_BASIC_MONTHLY!,
      pr_limit_per_month: 20,
    },
    {
      name: 'team',
      billing_interval: 'monthly',
      ext_stripe_price_id: process.env.STRIPE_PRICE_ID_VOID_TEAM_MONTHLY!,
      pr_limit_per_month: 100,
    },
  ]

  for (const plan of plans) {
    await dbClient
      .insertInto('voidpm.plan')
      .values({
        name: plan.name,
        billing_interval: plan.billing_interval,
        ext_stripe_price_id: plan.ext_stripe_price_id,
      })
      .executeTakeFirstOrThrow()
  }

  // eslint-disable-next-line no-console
  console.log('Created plans in database')

  process.exit()
})()

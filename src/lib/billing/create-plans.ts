import { dbClient } from '@/database/client'
;(async () => {
  const plans = [
    {
      name: 'basic',
      billing_interval: 'monthly',
      ext_stripe_price_id: process.env.STRIPE_PRICE_ID_HOMIE_BASIC_MONTHLY!,
    },
    {
      name: 'basic',
      billing_interval: 'yearly',
      ext_stripe_price_id: process.env.STRIPE_PRICE_ID_HOMIE_BASIC_YEARLY!,
    },
    {
      name: 'team',
      billing_interval: 'monthly',
      ext_stripe_price_id: process.env.STRIPE_PRICE_ID_HOMIE_TEAM_MONTHLY!,
    },
    {
      name: 'team',
      billing_interval: 'yearly',
      ext_stripe_price_id: process.env.STRIPE_PRICE_ID_HOMIE_TEAM_YEARLY!,
    },
  ]

  for (const plan of plans) {
    await dbClient
      .insertInto('homie.plan')
      .values({
        name: plan.name,
        billing_interval: plan.billing_interval,
        ext_stripe_price_id: plan.ext_stripe_price_id,
      })
      .onConflict((oc) =>
        oc.columns(['name', 'billing_interval']).doUpdateSet({
          name: plan.name,
          billing_interval: plan.billing_interval,
          ext_stripe_price_id: plan.ext_stripe_price_id,
        }),
      )
      .executeTakeFirstOrThrow()
  }

  // eslint-disable-next-line no-console
  console.log('Created plans in database')

  process.exit()
})()

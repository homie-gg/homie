import { dbClient } from '@/database/client'
;(async () => {
  const plans = [
    {
      name: 'basic',
      billing_interval: 'monthly',
      ext_stripe_price_id: process.env.STRIPE_PRICE_ID_HOMIE_BASIC_MONTHLY!,
    },
    {
      name: 'team',
      billing_interval: 'monthly',
      ext_stripe_price_id: process.env.STRIPE_PRICE_ID_HOMIE_TEAM_MONTHLY!,
    },
  ]

  for (const plan of plans) {
    const existingPlan = await dbClient
      .selectFrom('homie.plan')
      .where('name', '=', plan.name)
      .where('billing_interval', '=', plan.billing_interval)
      .select('id')
      .executeTakeFirst()

    if (existingPlan) {
      await dbClient
        .updateTable('homie.plan')
        .set({
          name: plan.name,
          billing_interval: plan.billing_interval,
          ext_stripe_price_id: plan.ext_stripe_price_id,
        })
        .where('homie.plan.id', '=', existingPlan.id)
        .executeTakeFirstOrThrow()

      continue
    }

    await dbClient
      .insertInto('homie.plan')
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

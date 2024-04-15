import { dbClient } from '@/lib/db/client'
;(async () => {
  const plans = [
    {
      name: 'basic',
      billing_interval: 'monthly',
      ext_stripe_price_id: process.env.STRIPE_PRICE_ID_VOID_BASIC_MONTHLY!,
      pr_limit_per_month: 50,
    },
    {
      name: 'team',
      billing_interval: 'monthly',
      ext_stripe_price_id: process.env.STRIPE_PRICE_ID_VOID_TEAM_MONTHLY!,
      pr_limit_per_month: 200,
    },
  ]

  for (const plan of plans) {
    const existingPlan = await dbClient
      .selectFrom('voidpm.plan')
      .where('name', '=', plan.name)
      .where('billing_interval', '=', plan.billing_interval)
      .select('id')
      .executeTakeFirst()

    if (existingPlan) {
      await dbClient
        .updateTable('voidpm.plan')
        .set({
          name: plan.name,
          billing_interval: plan.billing_interval,
          ext_stripe_price_id: plan.ext_stripe_price_id,
          pr_limit_per_month: plan.pr_limit_per_month,
        })
        .where('voidpm.plan.id', '=', existingPlan.id)
        .executeTakeFirstOrThrow()

      continue
    }

    await dbClient
      .insertInto('voidpm.plan')
      .values({
        name: plan.name,
        billing_interval: plan.billing_interval,
        ext_stripe_price_id: plan.ext_stripe_price_id,
        pr_limit_per_month: plan.pr_limit_per_month,
      })
      .executeTakeFirstOrThrow()
  }

  // eslint-disable-next-line no-console
  console.log('Created plans in database')

  process.exit()
})()

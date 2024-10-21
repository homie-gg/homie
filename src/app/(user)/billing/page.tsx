import { getUserOrganization } from '@/lib/auth/get-user-organization'
import { dbClient } from '@/database/client'
import OpenStripeCustomerPortalButton from '@/app/(user)/billing/_components/OpenStripeCustomerPortalButton'
import { redirect } from 'next/navigation'
import { getPlanLabel } from '@/lib/billing/get-plan-label'
import { SelectPlanGrid } from '@/app/(user)/billing/SelectPlanGrid'

interface BillingPageProps {}

export default async function BillingPage(props: BillingPageProps) {
  const {} = props

  return (
    <div>
      <div className="flex items-center justify-between space-y-2 mb-2">
        <h2 className="text-3xl font-bold tracking-tight">Billing</h2>
      </div>
      <Content />
    </div>
  )
}

async function Content() {
  const organization = await getUserOrganization()

  if (!organization) {
    redirect('/')
  }

  const subscription = await dbClient
    .selectFrom('homie.subscription')
    .innerJoin('homie.plan', 'homie.plan.id', 'homie.subscription.plan_id')
    .select([
      'homie.subscription.id',
      'homie.plan.name as plan_name',
      'homie.plan.billing_interval',
      'quantity',
    ])
    .where('organization_id', '=', organization.id)
    .where('stripe_status', '=', 'active')
    .executeTakeFirst()

  const basicMonthly = await dbClient
    .selectFrom('homie.plan')
    .where('name', '=', 'basic')
    .where('billing_interval', '=', 'monthly')
    .selectAll()
    .executeTakeFirstOrThrow()
  const basicYearly = await dbClient
    .selectFrom('homie.plan')
    .where('name', '=', 'basic')
    .where('billing_interval', '=', 'yearly')
    .selectAll()
    .executeTakeFirstOrThrow()

  const teamMonthly = await dbClient
    .selectFrom('homie.plan')
    .where('name', '=', 'team')
    .where('billing_interval', '=', 'monthly')
    .selectAll()
    .executeTakeFirstOrThrow()

  const teamYearly = await dbClient
    .selectFrom('homie.plan')
    .where('name', '=', 'team')
    .where('billing_interval', '=', 'yearly')
    .selectAll()
    .executeTakeFirstOrThrow()

  if (!subscription) {
    return (
      <SelectPlanGrid
        basicMonthlyPlan={basicMonthly}
        basicYearlyPlan={basicYearly}
        teamMonthlyPlan={teamMonthly}
        teamYearlyPlan={teamYearly}
      />
    )
  }

  if (subscription) {
    return (
      <>
        <p className="mb-4">
          You are currently subscribed to the {subscription.billing_interval}{' '}
          <strong>{getPlanLabel(subscription.plan_name)}</strong> plan for{' '}
          <strong>{subscription.quantity}</strong> contributors..
        </p>
        <OpenStripeCustomerPortalButton>
          Manage Subscription
        </OpenStripeCustomerPortalButton>
      </>
    )
  }

  return null
}

import { plans } from '@/app/_components/PricingTable'
import { getUserOrganization } from '@/lib/auth/get-user-organization'
import { dbClient } from '@/database/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/ui/Card'
import OpenStripeCustomerPortalButton from '@/app/(user)/billing/_components/OpenStripeCustomerPortalButton'
import SubscribeButton from '@/app/(user)/billing/_components/SubscribeButton'
import { redirect } from 'next/navigation'
import { Check } from 'lucide-react'
import { getPlanLabel } from '@/lib/billing/get-plan-label'

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

  const teamMonthly = await dbClient
    .selectFrom('homie.plan')
    .where('name', '=', 'team')
    .where('billing_interval', '=', 'monthly')
    .selectAll()
    .executeTakeFirstOrThrow()

  if (!subscription) {
    return (
      <>
        <p className="mb-8">Pick a plan to unlock more features</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex item-center justify-between">
                Basic
              </CardTitle>
              <div>
                <span className="text-3xl font-bold">$29</span>
                <span className="text-muted-foreground"> /month</span>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4 mb-4">
                {plans
                  .find((plan) => plan.title === 'Free')
                  ?.benefitList.map((benefit: string) => (
                    <span key={benefit} className="flex">
                      <Check className="text-green-500" />{' '}
                      <h3 className="ml-2">{benefit}</h3>
                    </span>
                  ))}
              </div>
              <SubscribeButton
                plan={basicMonthly}
                className="w-full"
                variant="outline"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex item-center justify-between">
                Team
              </CardTitle>
              <div>
                <span className="text-3xl font-bold">$349</span>
                <span className="text-muted-foreground"> /month</span>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4 mb-4">
                {plans
                  .find((plan) => plan.title === 'Team')
                  ?.benefitList.map((benefit: string) => (
                    <span key={benefit} className="flex">
                      <Check className="text-green-500" />{' '}
                      <h3 className="ml-2">{benefit}</h3>
                    </span>
                  ))}
              </div>
              <SubscribeButton plan={teamMonthly} className="w-full" />
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (subscription) {
    return (
      <>
        <p className="mb-4">
          You are currently subscribed to the {subscription.billing_interval}{' '}
          {getPlanLabel(subscription.plan_name)} plan.
        </p>
        <OpenStripeCustomerPortalButton>
          Manage Subscription
        </OpenStripeCustomerPortalButton>
      </>
    )
  }

  return null
}

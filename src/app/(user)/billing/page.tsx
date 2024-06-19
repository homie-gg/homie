import { plans } from '@/lib/billing/plans'
import { getUserOrganization } from '@/lib/auth/get-user-organization'
import { dbClient } from '@/database/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/ui/Card'
import OpenStripeCustomerPortalButton from '@/app/(user)/billing/_components/OpenStripeCustomerPortalButton'
import SubscribeButton from '@/app/(user)/billing/_components/SubscribeButton'
import { redirect } from 'next/navigation'
import { Check } from 'lucide-react'
import { getPlanLabel } from '@/lib/billing/get-plan-label'
import { Button } from '@/lib/ui/Button'

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

        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex item-center justify-between">
                Free
              </CardTitle>
              <div>
                <span className="text-3xl font-bold">$0</span>
                <span className="text-muted-foreground">
                  {' '}
                  / contributor / month
                </span>
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
              <Button disabled className="w-full" variant="outline">
                Current Plan
              </Button>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex item-center justify-between">
                Team
              </CardTitle>
              <div>
                <span className="text-3xl font-bold">$15</span>
                <span className="text-muted-foreground">
                  {' '}
                  / contributor / month
                </span>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-between">
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

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex item-center justify-between">
                Enterprise
              </CardTitle>
              <div>
                <span className="text-3xl font-bold">$30</span>
                <span className="text-muted-foreground">
                  {' '}
                  / contributor / month
                </span>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="space-y-4 mb-4">
                {plans
                  .find((plan) => plan.title === 'Enterprise')
                  ?.benefitList.map((benefit: string) => (
                    <span key={benefit} className="flex">
                      <Check className="text-green-500" />{' '}
                      <h3 className="ml-2">{benefit}</h3>
                    </span>
                  ))}
              </div>
              <Button disabled className="w-full">
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        <em className="mt-8 text-center block">
          Features marked with an asterisk (*) are coming very soon.
        </em>
      </>
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

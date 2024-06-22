'use client'

import { plans } from '@/lib/billing/plans'
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/ui/Card'
import SubscribeButton from '@/app/(user)/billing/_components/SubscribeButton'
import { Check } from 'lucide-react'
import { Button } from '@/lib/ui/Button'
import { useState } from 'react'
import { Plan } from '@/database/types'
import { Switch } from '@/lib/ui/Switch'

interface SelectPlanGridProps {
  teamMonthlyPlan: Plan
  teamYearlyPlan: Plan
}

export function SelectPlanGrid(props: SelectPlanGridProps) {
  const { teamMonthlyPlan, teamYearlyPlan } = props

  const [billingInterval, setBillintInterval] = useState<'yearly' | 'monthly'>(
    'yearly',
  )

  return (
    <>
      <p className="mb-8">Pick a plan to unlock more features</p>

      <div className="flex flex-row items-center justify-center mb-4 gap-4">
        <p>Monthly</p>
        <Switch
          checked={billingInterval === 'yearly'}
          onCheckedChange={(yearly) =>
            setBillintInterval(yearly ? 'yearly' : 'monthly')
          }
        />
        <p>Yearly</p>
      </div>
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
              <span className="text-3xl font-bold">
                {billingInterval === 'yearly' ? '$12' : '$15'}
              </span>
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
            <SubscribeButton
              plan={
                billingInterval === 'yearly' ? teamYearlyPlan : teamMonthlyPlan
              }
              className="w-full"
            />
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex item-center justify-between">
              Enterprise
            </CardTitle>
            <div>
              <span className="text-3xl font-bold">
                {' '}
                {billingInterval === 'yearly' ? '$24' : '$30'}
              </span>
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
import { Button } from '@/lib/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/lib/ui/Card'
import { SignUpButton } from '@clerk/nextjs'
import { Check } from 'lucide-react'

interface Plan {
  title: string
  isPopular: boolean
  isComingSoon: boolean
  price: number
  description: string
  buttonText: string
  benefitList: string[]
  afterSignUpUrl: string
}

export const plans: Plan[] = [
  {
    title: 'Free',
    isPopular: true,
    price: 0,
    isComingSoon: false,
    description: 'No credit card required. Setup takes less than 20 seconds.',
    buttonText: 'Sign up',
    benefitList: [
      'Up to 3 contributors',
      'Chat with homie in Slack',
      'Quickly create tasks',
      'Auto-generate PR summaries',
      'PR & Contributor statistics',
    ],
    afterSignUpUrl: '/review',
  },
  {
    title: 'Team',
    isPopular: false,
    price: 15,
    isComingSoon: true,
    description:
      'Save hundreds of engineer-hours each month. Boost developer & manager well-being.',
    buttonText: 'Subscribe',
    benefitList: [
      'Up to 10 contributors',
      'Learn Slack conversations*',
      'More app integration*',
      'Sync to Notion*',
      'Custom reminders*',
    ],
    afterSignUpUrl: '/billing?plan=team',
  },
  {
    title: 'Enterprise',
    isPopular: false,
    price: 30,
    isComingSoon: true,
    description: 'Advanced analytics, and reporting for large teams that ',
    buttonText: 'Subscribe',
    benefitList: [
      'Advanced dashboards & analytics*',
      'Milestone Analysis*',
      'PDF reports*',
      'Centralized billing*',
    ],
    afterSignUpUrl: '/billing?plan=enterprise',
  },
]

export default function PricingTable() {
  return (
    <section id="pricing" className="container py-24 sm:py-32">
      <h2 className="text-3xl md:text-6xl font-black text-center">
        homie <span className="text-8xl">grows</span> with your team.
      </h2>
      <h3 className="text-xl text-center text-muted-foreground pt-4 pb-8">
        homie is free forever for teams up to 3 contributors that open a Pull
        Request per month.
      </h3>
      <div className="grid lg:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card
            key={plan.title}
            className={
              plan.isPopular
                ? 'drop-shadow-xl shadow-black/10 dark:shadow-white/10'
                : ''
            }
          >
            <CardHeader>
              <CardTitle className="flex item-center justify-between">
                {plan.title}
              </CardTitle>
              <div>
                <span className="text-3xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">
                  /contributor/month
                </span>
              </div>

              <CardDescription className="h-[60px]">
                {plan.description}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <SignUpButton
                afterSignInUrl={plan.afterSignUpUrl}
                afterSignUpUrl={plan.afterSignUpUrl}
              >
                <Button
                  className="w-full"
                  variant={plan.isPopular ? 'default' : 'outline'}
                  disabled={plan.isComingSoon}
                >
                  {plan.buttonText}
                </Button>
              </SignUpButton>
            </CardContent>

            <hr className="w-4/5 m-auto mb-4" />

            <CardFooter className="flex">
              <div className="space-y-4">
                {plan.benefitList.map((benefit: string) => (
                  <span key={benefit} className="flex">
                    <Check className="text-green-500" />{' '}
                    <h3 className="ml-2">{benefit}</h3>
                  </span>
                ))}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
      <p className="text-center mt-4">
        <em>* Features are coming very soon.</em>
      </p>
    </section>
  )
}

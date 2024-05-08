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
      'Up to 30 PRs / month',
      'Ask anything in Slack',
      'Quickly create tasks',
      'Auto-generate PR summaries',
      'PR & Contributor statistics',
    ],
    afterSignUpUrl: '/review',
  },
  {
    title: 'Basic',
    isPopular: false,
    price: 29,
    isComingSoon: false,
    description: 'Perfect for new projects that want to hit the road running.',
    buttonText: 'Subscribe',
    benefitList: [
      'Up to 50 PRs / month',
      'Everything in Free',
      'Learn Slack messages*',
      'Trello, and Asana integration*',
      'Learn from Notion*',
    ],
    afterSignUpUrl: '/billing?plan=basic',
  },
  {
    title: 'Team',
    isPopular: false,
    price: 349,
    isComingSoon: false,
    description:
      'Save hundreds of engineer-hours each month. Boost developer & manager well-being.',
    buttonText: 'Subscribe',
    benefitList: [
      'Up to 200 PRs / month',
      'Everything in Basic',
      'Milestone Analysis*',
      'Custom reminders*',
      'Slack message reports*',
    ],
    afterSignUpUrl: '/billing?plan=team',
  },
  {
    title: 'Agency',
    isPopular: false,
    isComingSoon: true,
    price: 499,
    description:
      'Advanced management features. Most cost effective for multi-team organizations.',
    buttonText: 'Coming Soon',
    benefitList: [
      'Up to 500 PRs / month',
      'Everything in Team',
      'Multiple organizations*',
      'Generate report PDFs*',
      'API Access*',
    ],
    afterSignUpUrl: '/billing?plan=agency',
  },
]

export default function PricingTable() {
  return (
    <section id="pricing" className="container py-24 sm:py-32">
      <h2 className="text-3xl md:text-6xl font-black text-center">
        homie grows with you.
      </h2>
      <h3 className="text-xl text-center text-muted-foreground pt-4 pb-8">
        homie is free forever for small projects that might only require a few
        PRs a week.
      </h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-8">
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
                <span className="text-muted-foreground"> /month</span>
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

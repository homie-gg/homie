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
    isPopular: false,
    price: 0,
    isComingSoon: false,
    description: 'No credit card required. Setup takes less than 20 seconds.',
    buttonText: 'Get Started',
    benefitList: [
      'Ask anything in Slack',
      'Quickly create tasks',
      'Auto-generate PR summaries',
      'PR & Contributor statistics',
      'Up to 30 PRs / month',
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
      'Everything in Free',
      'Up to 50 PRs / month',
      'Learn Slack messages*',
      'Trello, and Asana integration*',
      'Learn from Notion',
    ],
    afterSignUpUrl: '/billing?plan=basic',
  },
  {
    title: 'Team',
    isPopular: true,
    price: 349,
    isComingSoon: false,
    description:
      'Save hundreds of engineer-hours each month. Boost developer & manager well-being.',
    buttonText: 'Subscribe',
    benefitList: [
      'Everything in Basic',
      'Up to 200 PRs / month',
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
      'Everything in Team',
      'Up to 500 PRs / month',
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
      <h2 className="text-3xl md:text-4xl font-bold text-center">
        Simple pricing that
        <span className="inline bg-gradient-to-r from-[#7C3AED]  to-[#F80282] text-transparent bg-clip-text">
          {' '}
          scales with your team
        </span>
      </h2>
      <h3 className="text-xl text-center text-muted-foreground pt-4 pb-8">
        Usage based on Pull Request count, so you don&apos;t need to worry about
        whether a contributor will take up a license.
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

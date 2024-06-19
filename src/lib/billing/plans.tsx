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
      'More than 3 Contributors',
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

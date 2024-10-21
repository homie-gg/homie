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
    title: 'Basic',
    isPopular: true,
    price: 0,
    isComingSoon: false,
    description: 'No credit card required. Setup takes less than 20 seconds.',
    buttonText: 'Sign up',
    benefitList: [
      'Chat with Homie in Slack',
      'Quickly create tasks',
      'Auto-generate PR summaries',
      'Pull Request Statistics',
    ],
    afterSignUpUrl: '/billing?plan=basic',
  },
  {
    title: 'Team',
    isPopular: false,
    price: 15,
    isComingSoon: false,
    description:
      'Save hundreds of engineer-hours each month. Boost developer & manager well-being.',
    buttonText: 'Subscribe',
    benefitList: [
      'Everything from Basic Plan',
      'Writes Code',
      'Task Analytics',
      'Contributor Overviews',
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
      'Everything from Team Plan',
      'Automatic Project Planning*',
      'Advanced Activity Tracking*',
      'Multiple Organizations*',
    ],
    afterSignUpUrl: '/billing?plan=business',
  },
]

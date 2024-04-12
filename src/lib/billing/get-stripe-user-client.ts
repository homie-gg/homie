import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripeUserClient: Stripe | null = null

export const getStripeUserClient = async () => {
  if (stripeUserClient) {
    return stripeUserClient
  }

  console.log('INIt stripe...')
  console.log('server key: ', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

  stripeUserClient = await loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  )

  return stripeUserClient
}

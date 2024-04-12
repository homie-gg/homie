import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripeUserClient: Stripe | null = null

export const getStripeUserClient = async () => {
  if (stripeUserClient) {
    return stripeUserClient
  }

  stripeUserClient = await loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  )

  return stripeUserClient
}

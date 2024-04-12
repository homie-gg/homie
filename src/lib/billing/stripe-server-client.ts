import Stripe from 'stripe'

export const stripeServerClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

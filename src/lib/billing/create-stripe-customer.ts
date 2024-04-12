import { stripeServerClient } from '@/lib/billing/stripe-server-client'
import Stripe from 'stripe'

interface CreateStripeCustomerParams {
  email: string
}

export async function createStripeCustomer(
  params: CreateStripeCustomerParams,
): Promise<Stripe.Customer> {
  const { email } = params

  return await stripeServerClient.customers.create({
    email,
  })
}

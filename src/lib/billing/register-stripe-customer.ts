import { getUserOrganization } from '@/lib/auth/get-user-organization'
import { createStripeCustomer } from '@/lib/billing/create-stripe-customer'
import { stripeServerClient } from '@/lib/billing/stripe-server-client'
import { dbClient } from '@/lib/db/client'
import { NotFoundException } from '@/lib/http/server/exceptions'
import Stripe from 'stripe'

interface CreateOrGetStripeCustomerParams {
  email: string
}

export async function registerStripeCustomer(
  params: CreateOrGetStripeCustomerParams,
): Promise<Stripe.Customer> {
  const { email } = params

  const organization = await getUserOrganization()

  if (!organization) {
    throw new NotFoundException({
      message: 'Failed creating Stripe customer; missing Void organization.',
      type: 'stripe_customer_create.failed',
    })
  }

  const customer = await createOrGetStripeCustomer({
    email,
  })

  await dbClient
    .updateTable('voidpm.organization')
    .set({ ext_stripe_customer_id: customer.id })
    .where('voidpm.organization.id', '=', organization.id)
    .executeTakeFirstOrThrow()

  return customer
}

async function createOrGetStripeCustomer(
  params: CreateOrGetStripeCustomerParams,
): Promise<Stripe.Customer> {
  const { email } = params

  const customers = await stripeServerClient.customers.list({ email })

  if (customers.data.length > 0) {
    return customers.data[0]
  }

  return await createStripeCustomer({ email })
}

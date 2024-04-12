import { NextResponse } from 'next/server'
import { registerStripeCustomer } from '@/lib/billing/register-stripe-customer'
import { createRoute } from '@/lib/http/server/create-route'
import { z } from 'zod'
import { stripeServerClient } from '@/lib/billing/stripe-server-client'
import { getUserEmail } from '@/app/auth/get-user-email'

const response = z.object({
  stripe_customer_portal_url: z.string(),
})

export type CreateCustomerPortalResponse = z.infer<typeof response>

export const POST = createRoute(
  {
    body: z.object({
      return_url: z.string(),
    }),
    response,
  },
  async (request) => {
    const { body } = request

    const email = await getUserEmail()

    const customer = await registerStripeCustomer({
      email,
    })

    const { url } = await stripeServerClient.billingPortal.sessions.create({
      customer: customer.id,
      return_url: body.return_url,
    })

    return NextResponse.json({
      stripe_customer_portal_url: url,
    })
  },
)

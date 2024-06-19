import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { registerStripeCustomer } from '@/lib/billing/register-stripe-customer'
import { createRoute } from '@/lib/http/server/create-route'
import { z } from 'zod'
import { stripeServerClient } from '@/lib/billing/stripe-server-client'
import {} from '@/lib/http/server/exceptions'
import { getUserEmail } from '@/app/auth/get-user-email'

const response = z.object({
  ext_stripe_session_id: z.string(),
})

export type CreateStripeCheckoutResponse = z.infer<typeof response>

export const POST = createRoute(
  {
    body: z.object({
      price_id: z.string(),
      cancel_url: z.string(),
      success_url: z.string(),
    }),
    response: z.object({
      ext_stripe_session_id: z.string(),
    }),
  },
  async (request) => {
    const { body } = request

    const email = await getUserEmail()

    const customer = await registerStripeCustomer({
      email,
    })

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      billing_address_collection: 'required',
      customer: customer.id,
      customer_update: {
        address: 'auto',
      },
      line_items: [
        {
          price: body.price_id,
          quantity: 1,
          adjustable_quantity: {
            enabled: true,
            minimum: 4,
            maximum: 1000,
          },
        },
      ],
      cancel_url: body.cancel_url,
      success_url: body.success_url,
    }

    const session = await stripeServerClient.checkout.sessions.create(params)
    return NextResponse.json({ ext_stripe_session_id: session.id })
  },
)

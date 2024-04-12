import Stripe from 'stripe'
import { getStripeWebhookEvent } from '@/lib/billing/get-stripe-webhook-event'
import { handleUpdatedSubscription } from '@/lib/billing/handle-updated-subscription'
import { logger } from '@/lib/log/logger'
import { NextRequest, NextResponse } from 'next/server'

const events = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
])

export const POST = async (request: NextRequest) => {
  const data = await request.clone().text()
  const signature = request.headers.get('stripe-signature') as string

  const jsonData = await request.clone().json()

  logger.debug('Received webhook', {
    event: 'stripe_webhook.received',
    data: JSON.stringify(jsonData),
    signature,
  })

  const event = getStripeWebhookEvent({
    data,
    signature,
  })

  if (!event) {
    return new NextResponse('Webhoook error', { status: 400 })
  }

  if (!events.has(event.type)) {
    logger.error(`Unsupported event type: '${event.type}'`, {
      event: 'stripe_webhook.unknown_event',
      data: JSON.stringify(jsonData),
    })
    return new NextResponse('Unsupported event', { status: 400 })
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription
      await handleUpdatedSubscription({
        ext_stripe_subscription_id: subscription.id,
        ext_stripe_customer_id: subscription.customer as string,
      })
      break
    case 'checkout.session.completed':
      const checkoutSession = event.data.object as Stripe.Checkout.Session
      if (checkoutSession.mode === 'subscription') {
        await handleUpdatedSubscription({
          ext_stripe_customer_id: checkoutSession.customer as string,
          ext_stripe_subscription_id: checkoutSession.subscription as string,
        })
      }
      break
    default:
      logger.error(`Unhandled event: ${event.type}`, {
        event: 'stripe_webhook.unhandled_event',
        data: JSON.stringify(jsonData),
      })

      return new NextResponse('Unhandled event', { status: 400 })
  }

  return NextResponse.json({ message: 'ok' })
}

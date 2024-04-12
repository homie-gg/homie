import { stripeServerClient } from '@/lib/billing/stripe-server-client'
import { logger } from '@/lib/log/logger'
import Stripe from 'stripe'

interface GetStripeWebhookEventParams {
  data: string
  signature: string
}

export function getStripeWebhookEvent(
  params: GetStripeWebhookEventParams,
): Stripe.Event | null {
  const { data, signature } = params

  try {
    return stripeServerClient.webhooks.constructEvent(
      data,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (error: any) {
    logger.debug(`Stripe webhook validation failed`, {
      event: 'stripe_webhook.validation_failed',
      error: error.message,
    })

    return null
  }
}

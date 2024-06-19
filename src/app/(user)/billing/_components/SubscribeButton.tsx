'use client'

import { CreateStripeCheckoutResponse } from '@/app/api/stripe/checkout/route'
import { getStripeUserClient } from '@/lib/billing/get-stripe-user-client'
import { Plan } from '@/database/types'
import { http } from '@/lib/http/client/http'
import { Button, ButtonProps } from '@/lib/ui/Button'
import { captureException } from '@sentry/nextjs'
import { useState } from 'react'

interface SubscribeButtonProps extends ButtonProps {
  plan: Plan
  className?: string
}

export default function SubscribeButton(props: SubscribeButtonProps) {
  const { plan, ...buttonProps } = props

  const [processing, setProcessing] = useState(false)

  const subscribe = async () => {
    if (processing) {
      return
    }

    setProcessing(true)

    try {
      const { ext_stripe_session_id } =
        await http.post<CreateStripeCheckoutResponse>('/api/stripe/checkout', {
          price_id: plan.ext_stripe_price_id,
          success_url: window.location.href,
          cancel_url: window.location.href,
        })

      const stripe = await getStripeUserClient()

      if (!stripe) {
        throw new Error('Failed to create stripe user client.')
      }

      stripe.redirectToCheckout({ sessionId: ext_stripe_session_id })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error)
      captureException(error)
    }

    setProcessing(false)
  }

  return (
    <Button onClick={subscribe} disabled={processing} {...buttonProps}>
      Subscribe
    </Button>
  )
}

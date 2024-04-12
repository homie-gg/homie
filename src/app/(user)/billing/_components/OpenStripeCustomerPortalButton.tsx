'use client'

import { CreateCustomerPortalResponse } from '@/app/api/stripe/customer_portal/route'
import { http } from '@/lib/http/client/http'
import { Button } from '@/lib/ui/Button'
import { PropsWithChildren, useState } from 'react'

interface OpenStripeCustomerPortalButtonProps extends PropsWithChildren {}

export default function OpenStripeCustomerPortalButton(
  props: OpenStripeCustomerPortalButtonProps,
) {
  const { children } = props

  const [processing, setProcessing] = useState(false)

  const openPortal = async () => {
    if (processing) {
      return
    }

    setProcessing(true)
    http
      .post<CreateCustomerPortalResponse>('/api/stripe/customer_portal', {
        return_url: window.location.href,
      })
      .then(({ stripe_customer_portal_url }) => {
        location.href = stripe_customer_portal_url
      })
      .catch(() => {
        setProcessing(false)
      })
  }

  return (
    <Button onClick={openPortal} disabled={processing} variant="outline">
      {children}
    </Button>
  )
}

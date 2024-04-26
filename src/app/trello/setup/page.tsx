'use client'

import { http } from '@/lib/http/client/http'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function TrelloSetup() {
  const [processing, setProcessing] = useState(false)
  const accessToken = window.location.hash.split('#token=')[1]

  const router = useRouter()

  useEffect(() => {
    if (processing) {
      return
    }

    setProcessing(true)

    if (accessToken.includes('error')) {
      router.push('/settings/trello?failed=true')
      return
    }

    http
      .post('/api/trello/install', {
        access_token: accessToken,
      })
      .then(() => {
        router.push('/settings/trello')
      })
      .catch(() => {
        router.push('/settings/trello?failed=true')
      })
  }, [processing, accessToken, router])

  return null
}

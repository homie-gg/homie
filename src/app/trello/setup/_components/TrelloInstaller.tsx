'use client'

import { http } from '@/lib/http/client/http'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

interface TrelloInstallerProps {
  organization: {
    id: number
  }
}

export default function TrelloInstaller(props: TrelloInstallerProps) {
  const { organization } = props
  const { id: organizationId } = organization

  const router = useRouter()

  const [processing, setProcessing] = useState(false)

  // This code must run client side since url hashes (#) are NOT
  // sent to the server.
  const accessToken = window.location.hash.split('#token=')[1]

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
      .post(`/api/organizations/${organizationId}/trello/install`, {
        access_token: accessToken,
      })
      .then(() => {
        router.push('/settings/trello')
      })
      .catch(() => {
        router.push('/settings/trello?failed=true')
      })
  }, [processing, accessToken, router, organizationId])

  return null
}

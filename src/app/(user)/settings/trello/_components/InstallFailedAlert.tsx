'use client'

import { Alert } from '@/lib/ui/Alert'
import { useSearchParams } from 'next/navigation'

export default function InstallFailedAlert() {
  const params = useSearchParams()

  const didFail = params.get('failed') === 'true'
  if (!didFail) {
    return null
  }

  return (
    <Alert variant="destructive" className="mb-4">
      Something went wrong. Please try again.
    </Alert>
  )
}

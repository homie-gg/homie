'use client'

import { Alert } from '@/lib/ui/Alert'

interface FetchUsersFailedAlertProps {}

export default function FetchUsersFailedAlert(
  props: FetchUsersFailedAlertProps,
) {
  const {} = props
  return (
    <Alert variant="destructive">
      Failed to fetch slack users.{' '}
      <span
        onClick={() => location.reload()}
        className="hover:underline cursor-pointer"
      >
        Click here to try again.
      </span>
    </Alert>
  )
}

import { Alert, AlertDescription, AlertTitle } from '@/lib/ui/Alert'
import { CircleAlert } from 'lucide-react'
import Link from 'next/link'

export default function OverPlanLimitAlert() {
  return (
    <Alert variant="destructive">
      <CircleAlert className="h-4 w-4" />
      <AlertTitle>Over plan limit</AlertTitle>
      <AlertDescription>
        You are currently over your monthly Pull Request Limit.{' '}
        <Link href="/billing" className="underline">
          Click here to go to billing
        </Link>
        .
      </AlertDescription>
    </Alert>
  )
}

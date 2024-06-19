import { Button } from '@/lib/ui/Button'
import Link from 'next/link'

export const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/asana/setup`

export default function InstallAsanaPage() {
  const url = `https://app.asana.com/-/oauth_authorize?response_type=code&client_id=${process.env.ASANA_CLIENT_ID}&redirect_uri=${returnUrl}`

  return (
    <Link href={url}>
      <Button>Install Asana App</Button>
    </Link>
  )
}

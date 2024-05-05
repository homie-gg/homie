import { Button } from '@/lib/ui/Button'
import Link from 'next/link'

const name = 'homie'
const scopes = ['read', 'write']
const expiration = 'never'
const callbackMethod = 'fragment' // redirect back (not POST)
const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/trello/setup`

export default function InstallTrelloPage() {
  const url = `https://trello.com/1/authorize?expiration=${expiration}&name=${name}&scope=${scopes.join(',')}&response_type=token&key=${process.env.NEXT_PUBLIC_TRELLO_API_KEY}&callback_method=${callbackMethod}&return_url=${returnUrl}`

  return (
    <Link href={url}>
      <Button>Install Trello App</Button>
    </Link>
  )
}

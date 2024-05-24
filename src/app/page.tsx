import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

export default async function Home() {
  const { userId } = auth()

  if (userId) {
    return redirect('/review')
  }

  location.href = 'https://homie.gg'
  return null
}

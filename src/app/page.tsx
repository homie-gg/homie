import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

export default async function Home() {
  const { userId } = auth()

  if (userId) {
    return redirect('/review')
  }

  return redirect('https://homie.gg')
}

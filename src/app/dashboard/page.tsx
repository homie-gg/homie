import { auth, clerkClient } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

export default async function Home() {
  const { userId } = auth()

  if (!userId) {
    redirect('/')
  }

  const user = await clerkClient.users.getUser(userId)

  return (
    <h1 className="text-3xl font-semibold text-black">
      👋 Hi, {user.firstName || `User`}
    </h1>
  )
}

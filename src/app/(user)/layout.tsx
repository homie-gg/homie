import { MainNav } from '@/app/(user)/_components/MainNav'
import { UserNav } from '@/app/(user)/_components/UserNav'
import { auth, clerkClient } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

interface UserLayoutProps {
  children: React.ReactNode
}

export default async function UserLayout(props: UserLayoutProps) {
  const { children } = props
  const { userId } = auth()

  if (!userId) {
    redirect('/')
  }

  const user = await clerkClient.users.getUser(userId)

  return (
    <>
      <div className="flex flex-col">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <MainNav className="mx-6" />
            <div className="ml-auto flex items-center space-x-4">
              <UserNav
                firstName={user.firstName}
                lastName={user.lastName}
                email={user.emailAddresses[0].emailAddress}
              />
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-4 p-8 pt-6">{children}</div>
      </div>
    </>
  )
}

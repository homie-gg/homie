import AppBar from '@/app/(user)/AppBar'
import Content from '@/app/(user)/Content'
import InstallPage from '@/app/(user)/_components/InstallPage'
import { MainNav } from '@/app/(user)/_components/MainNav'
import { dbClient } from '@/lib/db/client'
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

  const organization = await dbClient
    .selectFrom('voidpm.organization')
    .where('ext_clerk_user_id', '=', userId)
    .executeTakeFirst()

  if (!organization) {
    return (
      <div className="flex flex-col">
        <AppBar user={user} />
        <Content>
          <InstallPage />
        </Content>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <AppBar user={user}>
        <MainNav className="mx-6" />
      </AppBar>
      <Content>{children}</Content>
    </div>
  )
}

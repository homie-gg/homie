import { UserNav } from '@/app/(user)/_components/UserNav'
import { User } from '@clerk/nextjs/server'

interface AppBarProps {
  children?: React.ReactNode
  user: User
}

export default async function AppBar(props: AppBarProps) {
  const { children, user } = props

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        {children}
        <div className="ml-auto flex items-center space-x-4">
          <UserNav
            firstName={user.firstName}
            lastName={user.lastName}
            email={user.emailAddresses[0].emailAddress}
          />
        </div>
      </div>
    </div>
  )
}

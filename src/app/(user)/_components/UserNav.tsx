'use client'

import { Avatar } from '@/lib/ui/Avatar'
import { Button } from '@/lib/ui/Button'
import { PersonIcon } from '@radix-ui/react-icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/lib/ui/DropdownMenu'
import { useClerk } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ProfileIcon from '@/app/(user)/_components/ProfileIcon'

interface UserNavParams {
  email: string
  firstName: string | null
  lastName: string | null
}

export function UserNav(params: UserNavParams) {
  const { firstName, lastName, email } = params
  const { signOut } = useClerk()

  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <ProfileIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {firstName} {lastName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/billing">
            <DropdownMenuItem>Billing</DropdownMenuItem>
          </Link>
          <Link href="https://homie.nolt.io/roadmap">
            <DropdownMenuItem>Request Feature</DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            signOut(() => router.push('/'))
          }}
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

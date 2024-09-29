import React, { PropsWithChildren } from 'react'
import clsx from 'clsx'
import styles from './NavBar.module.scss'
import { cn } from '@/lib/utils'
import Logo from '@/app/_components/Logo'
import { UserNav } from '@/app/(user)/_components/UserNav'
import { User } from '@clerk/nextjs/server'
import PlanBadge from '@/app/(user)/_components/PlanBadge'

interface NavBarProps extends PropsWithChildren {
  user: User
}

export default function NavBar(props: NavBarProps) {
  const { user, children } = props

  return (
    <nav className={cn(styles.nav, styles.blueNav)}>
      <div className={clsx('container', styles.content)}>
        <div className={styles['content-start']}>
          <Logo />
          <div className={styles.menu}>{children}</div>
        </div>
        <div className={styles['content-end']}>
          <div className="mr-2">
            <PlanBadge />
          </div>
          <UserNav
            firstName={user.firstName}
            lastName={user.lastName}
            email={user.emailAddresses[0].emailAddress}
          />
        </div>
      </div>
    </nav>
  )
}

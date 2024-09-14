'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import clsx from 'clsx'
import styles from './NavBar.module.scss'

export const links = [
  {
    label: 'Dashboard',
    href: '/dashboard',
  },
  {
    label: 'Settings',
    href: '/settings/contributors',
  },
]

export default function NavLinks() {
  const pathname = usePathname()

  return (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={clsx(styles['menu-item'], {
            [styles['item--active']]: pathname.includes(
              link.href.split('/')[1],
            ),
          })}
        >
          {link.label}
        </Link>
      ))}
    </>
  )
}
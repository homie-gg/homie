'use client'

import { buttonVariants } from '@/lib/ui/Button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PropsWithChildren } from 'react'

interface SidebarItem {
  href: string
  text: string
}

interface SidebarProps extends PropsWithChildren {
  className?: string
  items: SidebarItem[]
}

export default function Sidebar(props: SidebarProps) {
  const { className, items } = props
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        'flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1',
        className,
      )}
      {...props}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            pathname === item.href
              ? 'bg-muted hover:bg-muted'
              : 'hover:bg-transparent hover:underline',
            'justify-start',
          )}
        >
          {item.text}
        </Link>
      ))}
    </nav>
  )
}

'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()

  return (
    <nav
      className={cn('flex items-center space-x-4 lg:space-x-6', className)}
      {...props}
    >
      <Link
        href="/review"
        className={cn(
          'text-sm font-medium transition-colors hover:text-primary',
          {
            'text-muted-foreground': pathname !== '/review',
          },
        )}
      >
        Review
      </Link>

      <Link
        href="/settings"
        className={cn(
          'text-sm font-medium transition-colors hover:text-primary',
          {
            'text-muted-foreground': pathname !== '/settings',
          },
        )}
      >
        Settings
      </Link>
    </nav>
  )
}

'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface DocsNavLinkProps {
  path: string
  label: string
}

export default function DocsNavLink(props: DocsNavLinkProps) {
  const { path, label } = props

  const currentPath = usePathname()

  const isActive = currentPath === path

  return (
    <Link
      href={path}
      className={cn(
        'group flex w-full items-center rounded-md border border-transparent px-2 py-1 hover:underline text-muted-foreground',
        {
          'text-muted-foreground': !isActive,
          'font-medium text-foreground': isActive,
        },
      )}
    >
      {label}
    </Link>
  )
}

'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/lib/ui/Sheet'

import { Menu } from 'lucide-react'
import { buttonVariants } from '@/lib/ui/Button'

interface RouteProps {
  href: string
  label: string
}

const routeList: RouteProps[] = [
  {
    href: '#features',
    label: 'Features',
  },
  {
    href: '#testimonials',
    label: 'Testimonials',
  },
  {
    href: '#pricing',
    label: 'Pricing',
  },
  {
    href: '#faq',
    label: 'FAQ',
  },
]

export const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger className="px-2">
        <Menu
          className="flex md:hidden h-5 w-5"
          onClick={() => setIsOpen(true)}
        ></Menu>
      </SheetTrigger>

      <SheetContent side={'left'}>
        <SheetHeader>
          <SheetTitle className="font-bold text-xl">Shadcn/React</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col justify-center items-center gap-2 mt-4">
          {routeList.map(({ href, label }: RouteProps) => (
            <a
              key={label}
              href={href}
              onClick={() => setIsOpen(false)}
              className={buttonVariants({ variant: 'ghost' })}
            >
              {label}
            </a>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}

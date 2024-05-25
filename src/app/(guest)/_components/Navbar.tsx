'use client'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from '@/lib/ui/NavigationMenu'

import { buttonVariants } from '@/lib/ui/Button'
// import { MobileMenu } from '@/app/_components/MobileMenu'
import Link from 'next/link'

export const Navbar = () => {
  return (
    <header className="sticky border-b-[1px] top-0 z-40 w-full bg-white dark:border-b-slate-700 dark:bg-background">
      <NavigationMenu className="mx-auto overflow-hidden">
        <NavigationMenuList className="container h-14 px-4 w-screen flex justify-between">
          <div className="flex justify-center items-center gap-8">
            <NavigationMenuItem className="font-bold flex">
              <a href="/" className="ml-2 font-black text-xl flex">
                homie
              </a>
            </NavigationMenuItem>
          </div>

          <nav className="hidden md:flex gap-2">
            <Link
              href="/login"
              className={`text-[0.875rem] ${buttonVariants({
                variant: 'ghost',
              })}`}
            >
              Login
            </Link>
            <Link
              href="/sign_up"
              className={`text-[0.875rem] ${buttonVariants({
                variant: 'default',
              })}`}
            >
              Sign Up
            </Link>
          </nav>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  )
}

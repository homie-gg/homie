'use client'
import Image from 'next/image'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from '@/lib/ui/NavigationMenu'
import logo from '@/assets/logo.svg'

import { buttonVariants } from '@/lib/ui/Button'
// import { MobileMenu } from '@/app/_components/MobileMenu'
import Link from 'next/link'

export const Navbar = () => {
  return (
    <header className="sticky border-b-[1px] top-0 z-40 w-full bg-white dark:border-b-slate-700 dark:bg-background">
      <NavigationMenu className="mx-auto">
        <NavigationMenuList className="container h-14 px-4 w-screen flex justify-between ">
          <NavigationMenuItem className="font-bold flex">
            <a href="/" className="ml-2 font-bold text-xl flex">
              <Image src={logo.src} alt="void" width={100} height={29} />
            </a>
          </NavigationMenuItem>

          {/* mobile */}
          {/* <div className="flex md:hidden">
            <MobileMenu />
          </div> */}

          {/* desktop */}
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
              Try for free
            </Link>
          </nav>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  )
}

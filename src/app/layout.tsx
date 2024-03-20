import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { cn } from '@/lib/utils'
import { TooltipProvider } from '@/lib/ui/Tooltip'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Void',
  description: 'AI Project Manager',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <TooltipProvider>
        <html lang="en">
          <body
            className={cn(
              'min-h-screen bg-background font-sans antialiased',
              inter.variable,
            )}
          >
            <main>{children}</main>
          </body>
        </html>
      </TooltipProvider>
    </ClerkProvider>
  )
}

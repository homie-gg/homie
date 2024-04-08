import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { cn } from '@/lib/utils'
import { TooltipProvider } from '@/lib/ui/Tooltip'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const googleAnalayticsMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

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
          {googleAnalayticsMeasurementId && (
            <head>
              <script
                async
                src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalayticsMeasurementId}`}
              />
              <script>
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', googleAnalayticsMeasurementId);
                `}
              </script>
            </head>
          )}
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

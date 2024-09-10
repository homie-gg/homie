import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.scss'
import { cn } from '@/lib/utils'
import { TooltipProvider } from '@/lib/ui/Tooltip'
import Script from 'next/script'
import { Toaster } from '@/lib/ui/Toast/Toaster'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'homie',
  description: 'AI Project Management',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const googleAnalayticsMeasurementId =
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  return (
    <ClerkProvider>
      <TooltipProvider>
        <html lang="en">
          {googleAnalayticsMeasurementId && (
            <head>
              <script
                async
                src={`https://www.googletagmanager.com/gtag/js?id="${googleAnalayticsMeasurementId}"`}
              />
              <Script id="google-analytics">
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', "${googleAnalayticsMeasurementId}");
                `}
              </Script>
            </head>
          )}
          <body
            className={cn(
              'min-h-screen bg-background font-sans antialiased',
              inter.variable,
            )}
          >
            <main className="h-screen">{children}</main>
            <Toaster />
          </body>
        </html>
      </TooltipProvider>
    </ClerkProvider>
  )
}

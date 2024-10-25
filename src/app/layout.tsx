import type { Metadata } from 'next'
import { Inter, Onest } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import localFont from 'next/font/local'
import './globals.scss'
import { TooltipProvider } from '@/lib/ui/Tooltip'
import Script from 'next/script'
import { Toaster } from '@/lib/ui/Toast/Toaster'
import clsx from 'clsx'

const onest = Onest({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-onest',
  display: 'swap',
})
const excon = localFont({
  src: [
    { path: '../assets/fonts/excon/Excon-Light.otf', weight: '300' },
    { path: '../assets/fonts/excon/Excon-Regular.otf', weight: '400' },
    { path: '../assets/fonts/excon/Excon-Medium.otf', weight: '500' },
    { path: '../assets/fonts/excon/Excon-Bold.otf', weight: '700' },
    { path: '../assets/fonts/excon/Excon-Black.otf', weight: '900' },
  ],
  variable: '--font-excon',
})
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

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
            className={clsx(onest.variable, excon.variable, inter.variable)}
          >
            <main className="h-screen">{children}</main>
            <Toaster />
          </body>
        </html>
      </TooltipProvider>
    </ClerkProvider>
  )
}

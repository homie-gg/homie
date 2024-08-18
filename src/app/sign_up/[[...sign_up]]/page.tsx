import { SignUp } from '@clerk/nextjs'
import Script from 'next/script'

export default function Page() {
  return (
    <>
      <Script id="google-analytics-sign-up">
        {`
            gtag('event', 'Sign_Up_Page');
        `}
      </Script>
      <div className="flex justify-center py-24">
        <SignUp />
      </div>
    </>
  )
}

import { Navbar } from '@/app/_components/Navbar'
import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import PricingTable from '@/app/_components/PricingTable'
import { Footer } from '@/app/_components/Footer'
import { SampleQuestions } from '@/app/_components/SampleQuestions'
import { buttonVariants } from '@/lib/ui/Button'
import Link from 'next/link'
import OnScrollRevealer from '@/lib/ui/OnScrollRevealer'
import DemoVideos from '@/app/_components/DemoVideos'
import CustomizePlayground from '@/app/_components/CustomizePersonaPlayground'

export default async function Home() {
  const { userId } = auth()

  if (userId) {
    return redirect('/review')
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="mb-64">
          <div className="text-center mt-32">
            <h1 className="text-8xl font-black text-center mb-2">homie</h1>
            <p className="text-lg">
              AI Project Manager
              <br />
              Automates. Answers questions. Sends reminders.
              <br />
              Helps your team ship faster.
            </p>
          </div>

          <div className="flex justify-center">
            <Image
              src="/homie-taco.png"
              alt="homie taco"
              width={256}
              height={256}
            />
          </div>
        </div>
      </div>

      <DemoVideos />
      <OnScrollRevealer>
        <CustomizePlayground />
      </OnScrollRevealer>
      <OnScrollRevealer>
        <PricingTable />
      </OnScrollRevealer>
      <OnScrollRevealer>
        <SampleQuestions />
      </OnScrollRevealer>
      <OnScrollRevealer>
        <div className="flex justify-center container mb-16">
          <div className="w-full bg-black py-32 text-white rounded-3xl flex flex-col items-center">
            <p className="text-4xl font-black mb-4">
              Let&apos;s be homies :&#41;
            </p>
            <Link
              href="/sign_up"
              className={buttonVariants({
                variant: 'secondary',
                size: 'lg',
              })}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </OnScrollRevealer>
      <Footer />
    </>
  )
}

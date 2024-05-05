import { Hero } from '@/app/_components/Hero'
import { Navbar } from '@/app/_components/Navbar'
import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import featureUnblock from '@/app/_assets/feature-unblock.png'
import featureAutomate from '@/app/_assets/feature-automate.png'
import featureReview from '@/app/_assets/feature-review.png'
import {
  ChartIcon,
  GiftIcon,
  LightBulbIcon,
  MagnifierIcon,
  MapIcon,
  MedalIcon,
  PlaneIcon,
  WalletIcon,
} from '@/app/_components/Icons'
import PricingTable from '@/app/_components/PricingTable'
import { Footer } from '@/app/_components/Footer'
import { SampleQuestions } from '@/app/_components/SampleQuestions'

export default async function Home() {
  const { userId } = auth()

  if (userId) {
    return redirect('/review')
  }

  return (
    <>
      <Navbar />
      <Hero />

      <div
        id="features"
        className="container py-24 sm:py-32 flex flex-col gap-7"
      >
        <div className="z-30 flex flex-col items-start gap-1">
          <span className="bg-purple-500 bg-clip-text text-sm font-semibold text-transparent">
            Features
          </span>
          <span className="text-xl font-medium">
            Everything to speed up your development lifecycle.
          </span>
        </div>

        <div className="flex flex-col items-start justify-center gap-16">
          <div className="grid grid-cols-1 flex-wrap items-start justify-center gap-10 lg:grid-cols-3">
            <div className="relative flex  flex-col overflow-hidden  rounded-md border bg-white transition-all duration-500 ease-in-out hover:shadow-md h-full">
              <div className="relative  transition-all duration-500 ease-in-out flex flex-1 items-center justify-center">
                <Image
                  src={featureUnblock}
                  alt="Slack message"
                  width={250}
                  height={220}
                />
              </div>
              <div className="z-10 flex flex-col items-start gap-1 bg-white p-5 lg:h-[12.5rem] xl:h-[10rem]">
                <h5 className="text-xl font-medium">Unblocks the team</h5>
                <p className="text-md font-normal text-zinc-700 ">
                  Ask homie anything from business to technical questions,
                  homie&apos;s got you.
                </p>
              </div>
            </div>

            <div className="relative flex  flex-col overflow-hidden  rounded-md border bg-white transition-all duration-500 ease-in-out hover:shadow-md h-full">
              <div className="relative  transition-all duration-500 ease-in-out flex flex-1 items-center justify-center">
                <Image src={featureAutomate} alt="Github PR summary" />
              </div>
              <div className="z-10 flex flex-col items-start gap-1 bg-white p-5 lg:h-[12.5rem] xl:h-[10rem]">
                <h5 className="text-xl font-medium">
                  Automates the boring stuff
                </h5>
                <p className="text-md font-normal text-zinc-700 ">
                  One-click issue creation, and PR summary generation that is
                  scary good.
                </p>
              </div>
            </div>

            <div className="relative flex  flex-col overflow-hidden  rounded-md border bg-white transition-all duration-500 ease-in-out hover:shadow-md h-full">
              <div className="relative  transition-all duration-500 ease-in-out flex flex-1 items-center justify-center">
                <Image src={featureReview} alt="homie dashboard" />
              </div>
              <div className="z-10 flex flex-col items-start gap-1 bg-white p-5 lg:h-[12.5rem] xl:h-[10rem]">
                <h5 className="text-xl font-medium">
                  Helps with reviews, and reminders
                </h5>
                <p className="text-md font-normal text-zinc-700 ">
                  100% automated, always know what the team&apos; working on.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-16 md:grid-cols-3 lg:grid-cols-4">
            <div className="flex flex-col items-start gap-1">
              <LightBulbIcon className="h-[50px]" />
              <h5 className="pt-1 text-lg font-medium">Quickly Create Tasks</h5>
              <p className="text-sm font-normal text-zinc-700">
                One click to create issues from Slack threads.
              </p>
            </div>

            <div className="flex flex-col items-start gap-1">
              <PlaneIcon className="h-[50px]" />
              <h5 className="pt-1 text-lg font-medium">Continous Retrain</h5>
              <p className="text-sm font-normal text-zinc-700">
                Accurate, and up-to-date context at every step.
              </p>
            </div>
            <div className="flex flex-col items-start gap-1">
              <MapIcon className="h-[50px]" />
              <h5 className="pt-1 text-lg font-medium">
                Multiple Data Sources
              </h5>
              <p className="text-sm font-normal text-zinc-700">
                Import data from multiple sources to train your chatbot.
              </p>
            </div>
            <div className="flex flex-col items-start gap-1">
              <WalletIcon className="h-[50px]" />
              <h5 className="pt-1 text-lg font-medium">
                Project Milestone Analysis
              </h5>
              <p className="text-sm font-normal text-zinc-700">
                Automatic PR analysis to make sure efforts are going towards key
                objectives.
              </p>
            </div>
            <div className="flex flex-col items-start gap-1">
              <MedalIcon className="h-[50px]" />
              <h5 className="pt-1 text-lg font-medium">
                Generate Pull Request Summaries
              </h5>
              <p className="text-sm font-normal text-zinc-700">
                Context-rich summaries that are include what was changed, and
                why.
              </p>
            </div>
            <div className="flex flex-col items-start gap-1">
              <ChartIcon className="h-[50px]" />
              <h5 className="pt-1 text-lg font-medium">Charts and Metrics</h5>
              <p className="text-sm font-normal text-zinc-700">
                Review team performance, and load by looking at PR, and
                contributor statistics.
              </p>
            </div>
            <div className="flex flex-col items-start gap-1">
              <MagnifierIcon className="h-[50px]" />
              <h5 className="pt-1 text-lg font-medium">Weekly Reports*</h5>
              <p className="text-sm font-normal text-zinc-700">
                See the PRs closed each week in Slack.
              </p>
            </div>
            <div className="flex flex-col items-start gap-1">
              <GiftIcon className="h-[50px]" />
              <h5 className="pt-1 text-lg font-medium">Custom Reminders*</h5>
              <p className="text-sm font-normal text-zinc-700">
                ever miss a review, or let issues go stale again.
              </p>
            </div>
          </div>
        </div>
      </div>
      <PricingTable />
      <SampleQuestions />
      <Footer />
    </>
  )
}

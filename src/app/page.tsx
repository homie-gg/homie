import { Navbar } from '@/app/_components/Navbar'
import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import PricingTable from '@/app/_components/PricingTable'
import { Footer } from '@/app/_components/Footer'
import { SampleQuestions } from '@/app/_components/SampleQuestions'
import MuxPlayerClient from '@/lib/ui/MuxPlayerClient'
import { Button, buttonVariants } from '@/lib/ui/Button'
import Link from 'next/link'

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
              Lives with your dev team.
              <br />
              Automates. Answers questions. Sends reminders.
              <br />
              All-round good homie.
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

        <div className="container grid grid-cols-1 lg:grid-cols-2 place-items-center text-center mb-64">
          <div>
            <h3 className="text-3xl lg:text-4xl font-bold mb-2">
              Add the GitHub app
            </h3>
            <p className="lg:text-lg mb-4 lg:mb-0">
              homie ingests each Pull Request. <br />
              Learns about your project.
            </p>
          </div>
          <div>
            <MuxPlayerClient
              streamType="on-demand"
              playbackId="MJ9SXa005c9NpG4K8tg3g6x5nw1qrsGV01G02bk1SjvDPg"
              metadataVideoTitle="homie in 20secs"
              primaryColor="#FFFFFF"
              secondaryColor="#000000"
              autoPlay
              muted
              loop
            />
          </div>
        </div>

        <div className="container grid grid-cols-1 lg:grid-cols-2 place-items-center text-center mb-64">
          <div className="hidden lg:block">
            <MuxPlayerClient
              streamType="on-demand"
              playbackId="MJ9SXa005c9NpG4K8tg3g6x5nw1qrsGV01G02bk1SjvDPg"
              metadataVideoTitle="homie in 20secs"
              primaryColor="#FFFFFF"
              secondaryColor="#000000"
              autoPlay
              muted
              loop
            />
          </div>
          <div>
            <h3 className="text-3xl lg:text-4xl font-bold mb-2">
              Add the Slack app
            </h3>
            <p className="lg:text-lg mb-4 lg:mb-0">
              homie becomes a part of your team.
            </p>
          </div>
          <div className="lg:hidden">
            <MuxPlayerClient
              streamType="on-demand"
              playbackId="MJ9SXa005c9NpG4K8tg3g6x5nw1qrsGV01G02bk1SjvDPg"
              metadataVideoTitle="homie in 20secs"
              primaryColor="#FFFFFF"
              secondaryColor="#000000"
              autoPlay
              muted
              loop
            />
          </div>
        </div>
      </div>

      <div className="container grid grid-cols-1 lg:grid-cols-2 place-items-center text-center mb-64">
        <div>
          <h3 className="text-3xl lg:text-4xl font-bold mb-2">
            Ask homie questions
          </h3>
          <p className="lg:text-lg mb-4 lg:mb-0">
            Has that bug already been fixed yet? How do we add a queued job?{' '}
            <br />
            Why did it timeout? Who knows how to do this?
          </p>
        </div>
        <div>
          <MuxPlayerClient
            streamType="on-demand"
            playbackId="MJ9SXa005c9NpG4K8tg3g6x5nw1qrsGV01G02bk1SjvDPg"
            metadataVideoTitle="homie in 20secs"
            primaryColor="#FFFFFF"
            secondaryColor="#000000"
            autoPlay
            muted
            loop
          />
        </div>
      </div>
      <div className="container grid grid-cols-1 lg:grid-cols-2 place-items-center text-center mb-64">
        <div className="hidden lg:block">
          <MuxPlayerClient
            streamType="on-demand"
            playbackId="MJ9SXa005c9NpG4K8tg3g6x5nw1qrsGV01G02bk1SjvDPg"
            metadataVideoTitle="homie in 20secs"
            primaryColor="#FFFFFF"
            secondaryColor="#000000"
            autoPlay
            muted
            loop
          />
        </div>
        <div>
          <h3 className="text-3xl lg:text-4xl font-bold mb-2">
            Let homie help
          </h3>
          <p className="lg:text-lg mb-4 lg:mb-0">
            Quickly summarize Slack threads to issues. <br />
            Generate PR summaries. Collect list of merged PRs.
          </p>
        </div>
        <div className="lg:hidden">
          <MuxPlayerClient
            streamType="on-demand"
            playbackId="MJ9SXa005c9NpG4K8tg3g6x5nw1qrsGV01G02bk1SjvDPg"
            metadataVideoTitle="homie in 20secs"
            primaryColor="#FFFFFF"
            secondaryColor="#000000"
            autoPlay
            muted
            loop
          />
        </div>
      </div>

      <PricingTable />
      <SampleQuestions />
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
      <Footer />
    </>
  )
}

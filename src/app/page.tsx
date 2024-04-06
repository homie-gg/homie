import { Hero } from '@/app/_components/Hero'
import { HowItWorks } from '@/app/_components/HowItWorks'
import { Navbar } from '@/app/_components/Navbar'
import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

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
            <div className="relative flex  flex-col overflow-hidden  rounded-md border bg-white transition-all duration-500 ease-in-out hover:shadow-md ">
              <div className="relative bg-zinc-200 transition-all duration-500 ease-in-out "></div>
              <div className="z-10 flex flex-col items-start gap-1 bg-white p-5 lg:h-[12.5rem] xl:h-[10rem]">
                <h5 className="text-xl font-medium">
                  Trustworthy, Accurate Answers
                </h5>
                <p className="text-md font-normal text-zinc-700 ">
                  With features like Revise answers and Confidence score you can
                  be sure your chatbot is giving the right answers.
                </p>
              </div>
            </div>

            <div className="relative flex  flex-col overflow-hidden  rounded-md border bg-white transition-all duration-500 ease-in-out hover:shadow-md ">
              <div className="relative bg-zinc-200 transition-all duration-500 ease-in-out "></div>
              <div className="z-10 flex flex-col items-start gap-1 bg-white p-5 lg:h-[12.5rem] xl:h-[10rem]">
                <h5 className="text-xl font-medium">
                  Trustworthy, Accurate Answers
                </h5>
                <p className="text-md font-normal text-zinc-700 ">
                  With features like Revise answers and Confidence score you
                  can be sure your chatbot is giving the right answers.
                </p>
              </div>
            </div>

            <div className="relative flex  flex-col overflow-hidden  rounded-md border bg-white transition-all duration-500 ease-in-out hover:shadow-md ">
              <div className="relative bg-zinc-200 transition-all duration-500 ease-in-out "></div>
              <div className="z-10 flex flex-col items-start gap-1 bg-white p-5 lg:h-[12.5rem] xl:h-[10rem]">
                <h5 className="text-xl font-medium">
                  Trustworthy, Accurate Answers
                </h5>
                <p className="text-md font-normal text-zinc-700 ">
                  With features like Revise answers and Confidence score you
                  can be sure your chatbot is giving the right answers.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-16 md:grid-cols-3 lg:grid-cols-4">
            <div className="flex flex-col items-start gap-1">
              <h5 className="pt-1 text-lg font-medium">
                Automatically ingests Pull Requests
              </h5>
              <p className="text-sm font-normal text-zinc-700">
                Import data from multiple sources to train your chatbot.
              </p>
            </div>
          </div>
        </div>
      </div>

      <HowItWorks />
    </>
  )
}

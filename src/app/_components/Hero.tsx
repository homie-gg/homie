import { Button } from '@/lib/ui/Button'
import Link from 'next/link'

export const Hero = () => {
  return (
    <section className="container grid lg:grid-cols-2 place-items-center py-20 md:py-32 gap-10">
      <div className="text-center lg:text-start space-y-6">
        <main className="text-5xl md:text-7xl font-bold">
          <h1 className="inline">
            <span className="">Project tools to fix slow dev and </span>{' '}
          </h1>
          <h2 className="inline">
            <span className="inline bg-gradient-to-r from-[#7C3AED]  to-[#F80282] text-transparent bg-clip-text">
              {' '}
              ship fast.
            </span>{' '}
          </h2>
        </main>

        <p className="text-xl text-muted-foreground md:w-10/12 mx-auto lg:mx-0">
          Void is an AI powered collection of project management tools that
          includes a dashboard, chatbot, reminders, and reports for your team.
          <br />
          <br />
          Built for async global teams that need to start shipping code faster
          today.
        </p>

        <div className="space-y-4 md:space-y-0 md:space-x-4 flex flex-col">
          <Link href="/sign_up">
            <Button className="w-full md:w-1/3 mb-1">Try for free</Button>
          </Link>
          <span className="h-0 text-sm text-zinc-500">
            No credit card required
          </span>
        </div>
      </div>

      {/* Hero cards sections */}
      <div className="z-10">{/* <HeroCards /> */}</div>
    </section>
  )
}

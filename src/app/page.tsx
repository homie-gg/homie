import { About } from '@/app/_components/About'
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
      <About />
      <HowItWorks />
    </>
  )
}

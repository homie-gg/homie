import { Navbar } from '@/app/(guest)/_components/Navbar'
import { Footer } from '@/app/_components/Footer'

interface GuestLayoutProps {
  children: string
}

export default async function GuestLayout(props: GuestLayoutProps) {
  const { children } = props

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 container py-6">{children}</div>
      <Footer />
    </div>
  )
}

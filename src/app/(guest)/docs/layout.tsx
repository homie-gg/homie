import DocsNav from '@/app/(guest)/docs/_components/DocsNav'
import { ScrollArea } from '@/lib/ui/ScrollArea'

interface DocsLayoutProps {
  children: React.ReactNode
}

export default function Docs(props: DocsLayoutProps) {
  const { children } = props

  return (
    <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
      <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
        <ScrollArea className="relative overflow-hidden h-full py-6 pr-6 lg:py-8">
          <div className="h-full w-full rounded-[inherit]">
            <DocsNav />
          </div>
        </ScrollArea>
      </aside>
      <main className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_300px]">
        <div className="mx-auto w-full min-w-0">
          <div>{children}</div>
        </div>
      </main>
    </div>
  )
}

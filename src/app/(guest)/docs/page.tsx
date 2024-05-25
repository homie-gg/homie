import { ScrollArea } from '@/lib/ui/ScrollArea'

interface Docs {}

export default function Docs(props: Docs) {
  const {} = props
  return (
    <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
      <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
        <ScrollArea className="relative overflow-hidden h-full py-6 pr-6 lg:py-8">
          <div className="h-full w-full rounded-[inherit]">
            <div className="pb-4">
              <h4 className="mb-1 rounded-md px-2 py-1 text-sm font-semibold">
                Getting Started
              </h4>
              <div className="grid grid-flow-row auto-rows-max text-sm">
                <a
                  href="#"
                  className="group flex w-full items-center rounded-md border border-transparent px-2 py-1 hover:underline text-muted-foreground"
                >
                  Setup
                </a>
              </div>
            </div>
            <div className="pb-4">
              <h4 className="mb-1 rounded-md px-2 py-1 text-sm font-semibold">
                Features
              </h4>

              <div className="grid grid-flow-row auto-rows-max text-sm">
                <a
                  href="#"
                  className="group flex w-full items-center rounded-md border border-transparent px-2 py-1 hover:underline text-muted-foreground"
                >
                  Chat in Slack
                </a>
                <a
                  href="#"
                  className="group flex w-full items-center rounded-md border border-transparent px-2 py-1 hover:underline text-muted-foreground"
                >
                  View Pull Requests
                </a>
              </div>
            </div>
            <div className="pb-4">
              <h4 className="mb-1 rounded-md px-2 py-1 text-sm font-semibold">
                Customizations
              </h4>

              <div className="grid grid-flow-row auto-rows-max text-sm">
                <a
                  href="#"
                  className="group flex w-full items-center rounded-md border border-transparent px-2 py-1 hover:underline font-medium text-foreground"
                >
                  Accordion
                </a>
                <a
                  href="#"
                  className="group flex w-full items-center rounded-md border border-transparent px-2 py-1 hover:underline text-muted-foreground"
                >
                  Alert
                </a>
              </div>
            </div>
          </div>
        </ScrollArea>
      </aside>
      <main className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_300px]">
        <div className="mx-auto w-full min-w-0">
          <div className="space-y-2">
            <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
              Accordion
            </h1>
            <p className="text-lg text-muted-foreground">
              <span data-br=":R29nnlfau6la:" data-brr="1">
                A vertically stacked set of interactive headings that each
                reveal a section of content.
              </span>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

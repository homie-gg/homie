import { Separator } from '@/lib/ui/Separator'
import Sidebar from '@/app/(user)/settings/_components/Sidebar'

interface SettingsPageProps {
  children: React.ReactNode
}

export default function SettingsPage(props: SettingsPageProps) {
  const { children } = props

  return (
    <div>
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Customize Void to how your team works
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/6">
          <Sidebar
            items={[
              { href: '/settings/contributors', text: 'Contributors' },
              {
                href: '/settings/pull_request_summaries',
                text: 'Pull Request Summaries',
              },
            ]}
          />
        </aside>
        <div className="flex-1 lg:max-w-2xl">{children}</div>
      </div>
    </div>
  )
}

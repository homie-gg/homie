import InstallFailedAlert from '@/app/(user)/settings/trello/_components/InstallFailedAlert'
import TrelloSettingsContent from '@/app/(user)/settings/trello/_components/TrelloSettingsContent'
import { Separator } from '@/lib/ui/Separator'

export default async function TrelloSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Trello</h3>
        <p className="text-sm text-muted-foreground">
          Add homie to your Trello workspace to create cards, link PRs, and get
          context from your boards.
        </p>
      </div>
      <Separator />
      <div className="space-y-4">
        <InstallFailedAlert />
        <TrelloSettingsContent />
      </div>
    </div>
  )
}

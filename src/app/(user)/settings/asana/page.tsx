import AsanaSettingsContent from '@/app/(user)/settings/asana/_components/AsanaSettingsContent'
import InstallFailedAlert from '@/app/(user)/settings/asana/_components/InstallFailedAlert'
import { Separator } from '@/lib/ui/Separator'

export default async function AsanaSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Asana</h3>
        <p className="text-sm text-muted-foreground">
          Add Homie to your Asana organization to track, create, and manage
          tasks.
        </p>
      </div>
      <Separator />
      <div className="space-y-4">
        <InstallFailedAlert />
        <AsanaSettingsContent />
      </div>
    </div>
  )
}

import GitlabSettingsContent from '@/app/(user)/settings/gitlab/_components/GitlabSettingsContent'
import { Separator } from '@/lib/ui/Separator'

export default async function GitlabSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Gitlab</h3>
        <p className="text-sm text-muted-foreground">
          Track your Gitlab projects
        </p>
      </div>
      <Separator />
      <div className="space-y-4">
        <GitlabSettingsContent />
      </div>
    </div>
  )
}

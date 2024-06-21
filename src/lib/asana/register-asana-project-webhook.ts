import { createAsanaClient } from '@/lib/asana/create-asana-client'
import { removeAsanaProjectWebhook } from '@/lib/asana/remove-asana-project-webhook'
import { AsanaWebhookCreateResponse } from '@/lib/asana/types'

interface RegisterAsanaProjectWebhookParams {
  asanaAppUser: {
    asana_access_token: string
  }
  project: {
    id: number
    ext_asana_project_id: string
    ext_asana_webhook_id: string | null
  }
}

export async function registerAsanaProjectWebhook(
  params: RegisterAsanaProjectWebhookParams,
) {
  const { project, asanaAppUser } = params

  await removeAsanaProjectWebhook({
    project,
    asanaAppUser,
  })

  const asana = createAsanaClient(asanaAppUser.asana_access_token)

  const { data } = await asana.post<AsanaWebhookCreateResponse>('/webhooks', {
    data: {
      resource: project.ext_asana_project_id,
      target: `${process.env.NEXT_PUBLIC_APP_URL}/api/asana/projects/${project.id}/webhook`,
      // filters: [
      //   { resource_type: 'task', action: 'changed', fields: ['name'] },
      //   { resource_type: 'task', action: 'added' },
      //   { resource_type: 'task', action: 'removed' },
      //   { resource_type: 'task', action: 'deleted' },
      //   { resource_type: 'task', action: 'undeleted' },
      // ],
    },
  })

  return data
}

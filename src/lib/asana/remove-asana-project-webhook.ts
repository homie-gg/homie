import { createAsanaClient } from '@/lib/asana/create-asana-client'

interface RemoveAsanaProjectWebhookParams {
  asanaAppUser: {
    asana_access_token: string
  }
  project: {
    ext_asana_project_id: string
    ext_asana_webhook_id: string | null
  }
}

export async function removeAsanaProjectWebhook(
  params: RemoveAsanaProjectWebhookParams,
) {
  const { asanaAppUser, project } = params
  if (!project.ext_asana_webhook_id) {
    return
  }

  const asana = createAsanaClient(asanaAppUser.asana_access_token)

  try {
    await asana.delete(`/webhooks/${project.ext_asana_webhook_id}`)
  } catch {
    // ignore failing to remove webhook
  }
}

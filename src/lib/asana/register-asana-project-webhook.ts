import { createAsanaClient } from '@/lib/asana/create-asana-client'
import { findProjectWebhook } from '@/lib/asana/find-project-webhook'
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

  const createPayload = {
    resource: project.ext_asana_project_id,
    target: `${process.env.NEXT_PUBLIC_APP_URL}/api/asana/projects/${project.id}/webhook`,
  }

  try {
    const { data } = await asana.post<AsanaWebhookCreateResponse>('/webhooks', {
      data: createPayload,
    })

    return data
  } catch (error) {
    // Check for duplicate webhook, and remove if it exists
    const webhook = await findProjectWebhook({
      project,
      asanaAppUser,
    })

    if (!webhook) {
      throw error
    }

    await asana.delete(`/webhooks/${webhook.gid}`)

    const { data } = await asana.post<AsanaWebhookCreateResponse>('/webhooks', {
      data: createPayload,
    })

    return data
  }
}

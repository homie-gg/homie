import { createAsanaClient } from '@/lib/asana/create-asana-client'
import {
  AsanaGetWorkspaceResponse,
  AsanaListWebhooksResponse,
} from '@/lib/asana/types'

interface FindProjectWebhookParams {
  asanaAppUser: {
    asana_access_token: string
  }
  project: {
    ext_asana_project_id: string
  }
}

export async function findProjectWebhook(params: FindProjectWebhookParams) {
  const { asanaAppUser, project } = params
  const asana = createAsanaClient(asanaAppUser.asana_access_token)

  // Fetch project data to get workspace info
  const {
    data: {
      workspace: { gid: workspaceId },
    },
  } = await asana.get<AsanaGetWorkspaceResponse>(
    `/projects/${project.ext_asana_project_id}`,
  )

  const { data: webhooks } = await asana.get<AsanaListWebhooksResponse>(
    `/webhooks?workspace=${workspaceId}`,
  )

  for (const webhook of webhooks) {
    if (
      webhook.resource.resource_type === 'project' &&
      webhook.resource.gid === project.ext_asana_project_id
    ) {
      return webhook
    }
  }
}

import { createJob } from '@/queue/create-job'
import { dbClient } from '@/database/client'
import { createAsanaClient } from '@/lib/asana/create-asana-client'
import { AsanaListProjectsResponse } from '@/lib/asana/types'

export const importAsanaProjects = createJob({
  id: 'import_asana_projects',
  handle: async (payload: {
    organization: {
      id: number
      asana_access_token: string
    }
  }) => {
    const { organization } = payload

    const asana = createAsanaClient(organization.asana_access_token)

    const response = await asana.get<AsanaListProjectsResponse>('/projects')

    for (const project of response.data) {
      await dbClient
        .insertInto('asana.project')
        .values({
          organization_id: organization.id,
          name: project.name,
          ext_asana_project_id: project.gid,
        })
        .onConflict((oc) =>
          oc.column('ext_asana_project_id').doUpdateSet({
            organization_id: organization.id,
            name: project.name,
          }),
        )
        .executeTakeFirstOrThrow()
    }
  },
})

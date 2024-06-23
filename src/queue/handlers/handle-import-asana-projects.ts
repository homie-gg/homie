import { dbClient } from '@/database/client'
import { ImportAsanaProjects } from '@/queue/jobs'
import { createAsanaClient } from '@/lib/asana/create-asana-client'
import { AsanaListProjectsResponse } from '@/lib/asana/types'

export async function handleImportAsanaProjects(job: ImportAsanaProjects) {
  const { organization } = job.data

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
}

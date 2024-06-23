import { createAsanaClient } from '@/lib/asana/create-asana-client'
import { ListAsanaTasksResponse } from '@/lib/asana/types'
import { dispatch } from '@/queue/default-queue'
import { ImportAsanaTasks } from '@/queue/jobs'

export async function handleImportAsanaTasks(job: ImportAsanaTasks) {
  const { organization, project } = job.data

  const asana = createAsanaClient(organization.asana_access_token)

  const { data: tasks } = await asana.get<ListAsanaTasksResponse>(
    `/tasks?project=${project.ext_asana_project_id}&limit=20`,
  )

  await Promise.all(
    tasks.map(async (task) => {
      await dispatch('sync_asana_task_to_homie_task', {
        ext_asana_task_id: task.gid,
        project_id: project.id,
      })
    }),
  )
}
import { createJob } from '@/queue/create-job'
import { createAsanaClient } from '@/lib/asana/create-asana-client'
import { ListAsanaTasksResponse } from '@/lib/asana/types'
import { syncAsanaTaskToHomieTask } from '@/queue/jobs/sync-asana-task-to-homie-task'

export const importAsanaTasks = createJob({
  id: 'import_asana_tasks',
  handle: async (payload: {
    organization: {
      id: number
      asana_access_token: string
    }
    project: {
      id: number
      ext_asana_project_id: string
    }
  }) => {
    const { organization, project } = payload

    const asana = createAsanaClient(organization.asana_access_token)

    const { data: tasks } = await asana.get<ListAsanaTasksResponse>(
      `/tasks?project=${project.ext_asana_project_id}&limit=20`,
    )

    await Promise.all(
      tasks.map(async (task) => {
        await syncAsanaTaskToHomieTask.dispatch({
          ext_asana_task_id: task.gid,
          project_id: project.id,
        })
      }),
    )
  },
})

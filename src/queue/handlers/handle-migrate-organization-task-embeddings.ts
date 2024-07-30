import { dbClient } from '@/database/client'
import { embedTask } from '@/lib/ai/embed-task'

export async function handleMigrateTaskEmbeddings(job: MigrateTaskEmbeddings) {
  const organizations = await dbClient
    .selectFrom('homie.organization')
    .select(['id'])
    .execute()

  await Promise.all(
    organizations.map(async (organization) => {
      const tasks = await dbClient
        .selectFrom('homie.task')
        .where('organization_id', '=', organization.id)
        .selectAll()
        .execute()

      await Promise.all(
        tasks.map(async (task) => {
          await embedTask({ task })
        }),
      )
    }),
  )
}

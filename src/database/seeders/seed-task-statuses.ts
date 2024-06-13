import { dbClient } from '@/database/client'
import { taskStatus } from '@/lib/tasks'

export async function seedTaskStatuses() {
  for (const [name, id] of Object.entries(taskStatus)) {
    await dbClient
      .insertInto('homie.task_status')
      .values({
        id,
        name,
      })
      .onConflict((oc) =>
        oc.column('id').doUpdateSet({
          name,
        }),
      )
      .executeTakeFirstOrThrow()
  }
}

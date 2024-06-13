import { dbClient } from '@/database/client'
import { taskType } from '@/lib/tasks/task-type'

export async function seedTaskTypes() {
  for (const [name, id] of Object.entries(taskType)) {
    await dbClient
      .insertInto('homie.task_type')
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

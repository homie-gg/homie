import { dbClient } from '@/database/client'

interface AssignContributorToTask {
  task_id: number
  contributor_id: number
}

export async function assignContributorToTask(params: AssignContributorToTask) {
  const { task_id, contributor_id } = params

  await dbClient
    .insertInto('homie.contributor_task')
    .values({
      task_id,
      contributor_id,
    })
    .onConflict((oc) => {
      return oc.columns(['contributor_id', 'task_id']).doNothing()
    })
    .executeTakeFirstOrThrow()
}

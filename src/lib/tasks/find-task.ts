import { dbClient } from '@/database/client'

interface FindTaskParams {
  organization_id: number
  name?: string
  id?: number
}

type FindTaskResult =
  | {
      name: string
      html_url: string
      description: string
    }
  | null
  | undefined

export async function findTask(
  params: FindTaskParams,
): Promise<FindTaskResult> {
  const { organization_id, id, name } = params

  if (id) {
    return dbClient
      .selectFrom('homie.task')
      .where('homie.task.id', '=', id)
      .where('homie.task.organization_id', '=', organization_id)
      .select(['name', 'html_url', 'description'])
      .executeTakeFirst()
  }

  if (name) {
    return dbClient
      .selectFrom('homie.task')
      .where('homie.task.name', 'like', `%${name}%`)
      .where('homie.task.organization_id', '=', organization_id)
      .select(['name', 'html_url', 'description'])
      .executeTakeFirst()
  }

  return null
}

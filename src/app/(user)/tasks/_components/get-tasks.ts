import { dbClient } from '@/database/client'
import { sql } from 'kysely'

export type Task = {
  task_type: string
}

interface GetTasksParams {
  organization: {
    id: number
  }
}

export interface PaginatedCollection<T> {
  current_page: number
  data: T[]
  first_page_url: string
  from: number
  last_page: number
  last_page_url: string
  next_page_url: string | null
  per_page: number
  prev_page_url: string | null
  to: number
  total: number
}

interface TaskTypeCount {
  type: string
  count: number
}

export type Tasks = PaginatedCollection<Task> & {
  task_types: Array<TaskTypeCount>
}

export async function getTasks(params: GetTasksParams): Promise<Tasks> {
  const { organization } = params

  const query = dbClient
    .selectFrom('homie.task')
    .where('homie.task.organization_id', '=', organization.id)
    .innerJoin(
      'homie.task_type',
      'homie.task.task_type_id',
      'homie.task_type.id',
    )

  // Get total count
  const { total } = await query
    .select(sql<number>`count(*)`.as('total'))
    .executeTakeFirstOrThrow()

  const taskTypes: TaskTypeCount[] = (
    await query
      .select(['homie.task_type.name as task_type'])
      .select((eb) => [eb.fn.count('homie.task.id').as('count')])
      .groupBy('task_type')
      .execute()
  ).map((type) => ({
    type: type.task_type,
    count: typeof type.count === 'number' ? type.count : Number(type.count),
  }))

  const page = 1
  const perPage = 20

  const offset = (page - 1) * perPage

  const paginated = await query
    .limit(perPage) // per page
    .offset(offset) // page
    .select(['homie.task_type.name as task_type'])
    .execute()

  const baseUrl = 'http://localhost:3000/tasks'

  const lastPage = Math.ceil(total / perPage)

  const buildUrl = (targetPage: number) =>
    `${baseUrl}?page=${targetPage}&per_page=${perPage}`

  return {
    current_page: page,
    data: paginated,
    first_page_url: buildUrl(1),
    last_page: lastPage,
    last_page_url: buildUrl(lastPage),
    next_page_url: page < lastPage ? buildUrl(page + 1) : null,
    per_page: perPage,
    prev_page_url: page > 1 ? buildUrl(page - 1) : null,
    from: offset + 1, // first item on page
    to: Math.min(offset + perPage, total), // last item on page,
    total,
    task_types: taskTypes,
  }
}

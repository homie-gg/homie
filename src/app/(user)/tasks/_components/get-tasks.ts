import { TaskCategory } from '@/app/(user)/tasks/_components/TaskCategorySelectItem'
import { dbClient } from '@/database/client'
import { taskStatus } from '@/lib/tasks'
import { sql } from 'kysely'
import { taskPriority } from '@/lib/tasks/task-priority'
import { searchTasks } from '@/app/(user)/tasks/_components/search-tasks'
import { endOfWeek, startOfWeek, subDays } from 'date-fns'

export type Task = {
  id: number
  name: string
  priority_level: number
  created_at: Date
  estimated_completion_date: Date | null
  html_url: string
}

interface GetTasksParams {
  organization: {
    id: number
  }
  category?: TaskCategory
  added_from?: string
  added_to?: string
  page?: string
  search?: string
  priority?: string
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
  num_pages: number
}

interface TaskTypeCount {
  type: string
  count: number
}

export type Tasks = PaginatedCollection<Task> & {
  task_types: Array<TaskTypeCount>
  task_priorities: Record<string, number>
  total_estimated_days_to_complete: number
  num_stale_tasks: number
}

export async function getTasks(params: GetTasksParams): Promise<Tasks> {
  const {
    organization,
    category = 'all',
    added_from,
    added_to,
    search,
    priority,
  } = params

  let query = dbClient
    .selectFrom('homie.task')
    .where('homie.task.organization_id', '=', organization.id)
    .where('homie.task.task_status_id', '=', taskStatus.open)

  if (added_from) {
    query = query.where('homie.task.created_at', '>=', new Date(added_from))
  }

  if (added_to) {
    query = query.where('homie.task.created_at', '<=', new Date(added_to))
  }

  const priorityLevel = taskPriority[priority as keyof typeof taskPriority]
  if (priorityLevel !== undefined) {
    query = query.where('homie.task.priority_level', '=', priorityLevel)
  }

  const searchMatchingIds = await searchTasks({
    organization,
    searchTerm: search,
  })
  if (searchMatchingIds) {
    if (searchMatchingIds.length === 0) {
      query = query.where('homie.task.id', '=', 0) // force 0 results
    } else {
      query = query.where('homie.task.id', 'in', searchMatchingIds)
    }
  }

  if (category === 'new_tasks') {
    query = query.where('homie.task.created_at', '>', subDays(new Date(), 3))
  }

  if (category === 'due_this_week') {
    query = query.where('homie.task.due_date', '>', startOfWeek(new Date()))
    query = query.where('homie.task.due_date', '<', endOfWeek(new Date()))
  }

  if (category === 'late') {
    query = query.where('homie.task.due_date', '<', new Date())
  }

  if (category === 'unassigned') {
    query = query.where(({ exists, selectFrom, not }) =>
      not(
        exists(
          selectFrom('homie.contributor_task').whereRef(
            'homie.contributor_task.task_id',
            '=',
            'homie.task.id',
          ),
        ),
      ),
    )
  }

  if (category === 'stale') {
    query = query.where('homie.task.is_stale', '=', true)
  }

  // Get  counts
  const { total, total_estimated_days_to_complete, num_stale_tasks } =
    await query
      .select(sql<number>`count(*)`.as('total'))
      .select(({ fn }) => [
        fn
          .sum<number>(sql`COALESCE(estimated_days_to_complete, 0)`)
          .as('total_estimated_days_to_complete'),
      ])
      .select(({ fn }) => [
        fn
          .sum<number>(sql`COALESCE(estimated_days_to_complete, 0)`)
          .as('total_estimated_days_to_complete'),
      ])
      .select((eb) =>
        eb.fn
          .sum<number>(
            sql`
          case
            when is_stale = true then 1
            else 0
          end
        `,
          )
          .as('num_stale_tasks'),
      )

      .executeTakeFirstOrThrow()

  const taskTypes: TaskTypeCount[] = (
    await query
      .innerJoin(
        'homie.task_type',
        'homie.task.task_type_id',
        'homie.task_type.id',
      )
      .select(['homie.task_type.name as task_type'])
      .select((eb) => [eb.fn.count('homie.task.id').as('count')])
      .groupBy('task_type')
      .execute()
  ).map((type) => ({
    type: type.task_type,
    count: typeof type.count === 'number' ? type.count : Number(type.count),
  }))

  const taskPriorities: Record<string, number> = (
    await query
      .select(['priority_level'])
      .select((eb) => [eb.fn.count('homie.task.id').as('count')])
      .groupBy('priority_level')
      .execute()
  ).reduce((acc, i) => {
    acc[i.priority_level] =
      typeof i.count === 'number' ? i.count : Number(i.count)
    return acc
  }, {} as any)

  const page = parseInt(params.page ?? '1')
  const perPage = 8

  const offset = (page - 1) * perPage

  // Fetch tasks
  const paginated = await query
    .limit(perPage) // per page
    .offset(offset) // page
    .select([
      'id',
      'name',
      'estimated_days_to_complete',
      'due_date',
      'priority_level',
      'created_at',
      'estimated_completion_date',
      'html_url',
    ])
    .execute()

  const baseUrl = '/tasks'

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
    total_estimated_days_to_complete,
    num_stale_tasks,
    task_priorities: taskPriorities,
    num_pages: lastPage,
  }
}

import PageHeader from '@/app/(user)/_components/PageHeader'
import PageTitle from '@/app/(user)/_components/PageTitle'
import styles from './_components/TasksPage.module.scss'
import clsx from 'clsx'
import TaskMetrics from '@/app/(user)/tasks/_components/TaskMetrics'
import TasksTable from '@/app/(user)/_components/TasksTable'
import { getUserOrganization } from '@/lib/auth/get-user-organization'
import TaskCategorySelect from '@/app/(user)/tasks/_components/TaskCategorySelect'
import { TaskCategory } from '@/app/(user)/tasks/_components/TaskCategorySelectItem'
import { getTasks } from '@/app/(user)/_components/TasksTable/get-tasks'

interface TasksPageProps {
  searchParams: {
    category?: TaskCategory
    added_from?: string
    added_to?: string
    page?: string
    search?: string
    priority?: string
  }
}

export default async function TasksPage(props: TasksPageProps) {
  const {
    searchParams: { category, added_from, added_to, page, search, priority },
  } = props

  const organization = await getUserOrganization()
  if (!organization) {
    return
  }

  const tasks = await getTasks({
    organization,
    category,
    added_from,
    added_to,
    page,
    search,
    priority,
  })

  return (
    <div className={styles.main}>
      <div className={clsx('container', styles.container)}>
        <PageHeader>
          <PageTitle>Tasks</PageTitle>
        </PageHeader>
        <TaskCategorySelect />
        <TaskMetrics tasks={tasks} />
        <TasksTable tasks={tasks} />
      </div>
    </div>
  )
}

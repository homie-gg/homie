import PageHeader from '@/app/(user)/_components/PageHeader'
import PageTitle from '@/app/(user)/_components/PageTitle'
import styles from './_components/TasksPage.module.scss'
import clsx from 'clsx'
import TaskMetrics from '@/app/(user)/tasks/_components/TaskMetrics'
import TasksTable from '@/app/(user)/tasks/_components/TasksTable'
import { getUserOrganization } from '@/lib/auth/get-user-organization'
import TaskCategorySelect from '@/app/(user)/tasks/_components/TaskCategorySelect'
import { TaskCategory } from '@/app/(user)/tasks/_components/TaskCategorySelectItem'
import { dbClient } from '@/database/client'
import { getTasks } from '@/app/(user)/tasks/_components/get-tasks'

interface TasksPageProps {
  searchParams: {
    category?: TaskCategory
  }
}

export default async function TasksPage(props: TasksPageProps) {
  const { searchParams } = props

  const organization = await getUserOrganization()
  if (!organization) {
    return
  }

  console.log(searchParams.category)

  const tasks = await getTasks({ organization })

  return (
    <div className={styles.main}>
      <div className={clsx('container', styles.container)}>
        <PageHeader>
          <PageTitle>Tasks</PageTitle>
        </PageHeader>
        <TaskCategorySelect />
        <TaskMetrics tasks={tasks} />
        <TasksTable />
      </div>
    </div>
  )
}

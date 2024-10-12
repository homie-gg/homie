import PageHeader from '@/app/(user)/_components/PageHeader'
import PageTitle from '@/app/(user)/_components/PageTitle'
import TaskFilters from '@/app/(user)/tasks/_components/TaskFilters'
import styles from './_components/TasksPage.module.scss'
import clsx from 'clsx'

interface TasksPageProps {}

export default function TasksPage(props: TasksPageProps) {
  const {} = props
  return (
    <div className={styles.main}>
      <div className={clsx('container', styles.container)}>
        <PageHeader>
          <PageTitle>Tasks</PageTitle>
        </PageHeader>
        <TaskFilters />
      </div>
    </div>
  )
}

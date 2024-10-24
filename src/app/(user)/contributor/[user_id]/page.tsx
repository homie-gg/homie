import clsx from 'clsx'
import ContributorHeader from './_components/ContributorHeader'
import ContributorData from './_components/ContributorData'
import ContributorPrPerRepo from './_components/ContributorPrPerRepo'
import CompletedPullRequests from './_components/ContributorCompletedPullRequests'
import ChartCard from '@/lib/ui/ChartCard'
import PeriodChart from '@/lib/ui/PeriodChart'
import TasksTable from '@/app/(user)/tasks/_components/TasksTable'
import { Task } from '@/app/(user)/tasks/_components/get-tasks'
import styles from './_components/ContributorDetailsPage.module.scss'

const contributorPrPerRepoData = [
  {
    repo: 'Repo 1',
    prCount: 5,
  },
  {
    repo: 'Repo 2',
    prCount: 3,
  },
  {
    repo: 'Repo 3',
    prCount: 2,
  },
  {
    repo: 'Repo 4',
    prCount: 1,
  },
  {
    repo: 'Repo 5',
    prCount: 1,
  },
]

const periodData = [
  {
    day: 'Day 1',
    current: 3,
    previous: 1,
  },
  {
    day: 'Day 2',
    current: 5,
    previous: 3,
  },
  {
    day: 'Day 3',
    current: 11,
    previous: 5,
  },
  {
    day: 'Day 4',
    current: 14,
    previous: 7,
  },
]

interface ContributorDetailsPageProps {}

export default function ContributorDetailsPage(
  props: ContributorDetailsPageProps,
) {
  const {} = props

  const tasks: Task[] = []

  return (
    <div className={styles.root}>
      <div className={clsx('container', styles.container)}>
        <ContributorHeader
          user={{
            name: 'Andre Flores',
            username: 'andreflores',
            image: '',
          }}
        />
        <ContributorData
          country={{
            name: 'Canda',
            image: '',
          }}
          hoursSinceLastPr={25}
          tasksAssigned={5}
          tasksCompleted={3}
        />
        <TasksTable
          tasks={{
            data: tasks,
            num_pages: 0,
            current_page: 1,
            first_page_url: '',
            from: 1,
            last_page: 1,
            last_page_url: '',
            next_page_url: null,
            per_page: tasks.length,
            prev_page_url: null,
            to: tasks.length,
            total: tasks.length,
            task_types: [],
            num_stale_tasks: 0,
            task_priorities: {},
            total_estimated_days_to_complete: 5,
          }}
        />
        <div className={styles.section}>
          <div className={styles['section-content']}>
            <ContributorPrPerRepo data={contributorPrPerRepoData} />
            <CompletedPullRequests completedPullRequests={[]} />
          </div>
        </div>
        <div className={styles.section}>
          <div className={styles['section-content']}>
            <ChartCard title="Activity Score">
              <div className={styles['chart-container']}>
                <PeriodChart data={periodData} xOrientation="top" />
              </div>
            </ChartCard>
            <ChartCard title="Impact Score">
              <div className={styles['chart-container']}>
                <PeriodChart data={periodData} xOrientation="top" />
              </div>
            </ChartCard>
          </div>
        </div>
      </div>
    </div>
  )
}

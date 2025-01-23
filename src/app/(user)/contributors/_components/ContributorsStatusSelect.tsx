import ContributorsStatusSelectItem from '@/app/(user)/contributors/_components/ContributorsStatusSelectItem'
import styles from './ContributorsStatusSelect.module.scss'

export default function ContributorCategorySelect() {
  return (
    <div className={styles.container}>
      <p className={styles.label}>Quick Filters</p>
      <ul className={styles.content}>
        <ContributorsStatusSelectItem value="none">
          None
        </ContributorsStatusSelectItem>
        <ContributorsStatusSelectItem value="low_on_tasks">
          Low on tasks
        </ContributorsStatusSelectItem>
        <ContributorsStatusSelectItem value="no_tasks">
          No task assigned
        </ContributorsStatusSelectItem>
      </ul>
    </div>
  )
}

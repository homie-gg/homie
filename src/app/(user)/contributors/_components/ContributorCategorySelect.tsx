import ContributorCategorySelectItem from './ContributorCategorySelectItem'
import styles from './ContributorCategorySelect.module.scss'

const ContributorCategorySelect = () => {
  return (
    <div className={styles.container}>
      <p className={styles.label}>Quick Filters</p>
      <ul className={styles.content}>
        <ContributorCategorySelectItem value="none">
          None
        </ContributorCategorySelectItem>
        <ContributorCategorySelectItem value="low_on_tasks">
          Low on tasks
        </ContributorCategorySelectItem>
        <ContributorCategorySelectItem value="no_tasks">
          No task assigned
        </ContributorCategorySelectItem>
      </ul>
    </div>
  )
}

export default ContributorCategorySelect

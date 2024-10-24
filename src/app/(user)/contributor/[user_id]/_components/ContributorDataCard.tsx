import styles from './ContributorDataCard.module.scss'

type ContributorDataCardProps = {
  label: string
  data: string | React.ReactNode
}

const ContributorDataCard = ({ label, data }: ContributorDataCardProps) => {
  return (
    <div className={styles.card}>
      <div className={styles.data}>
        <p className={styles.label}>{label}</p>
        <p className={styles.text}>{data}</p>
      </div>
    </div>
  )
}

export default ContributorDataCard

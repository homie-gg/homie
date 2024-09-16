import styles from './Logo.module.scss'

export default function Logo() {
  return (
    <div className={styles.container}>
      <span className={styles.logo}>Homie</span>
    </div>
  )
}

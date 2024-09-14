import { PropsWithChildren } from 'react'
import styles from './PageTitle.module.scss'

interface PageTitleProps extends PropsWithChildren {}

export default function PageTitle(props: PageTitleProps) {
  const { children } = props
  return <h2 className={styles.root}>{children}</h2>
}

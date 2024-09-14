import { PropsWithChildren } from 'react'
import styles from './PageHeader.module.scss'

interface PageHeaderProps extends PropsWithChildren {}

export default function PageHeader(props: PageHeaderProps) {
  const { children } = props
  return <div className={styles.root}>{children}</div>
}

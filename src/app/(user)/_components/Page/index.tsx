import { PropsWithChildren } from 'react'
import clsx from 'clsx'
import styles from './Page.module.scss'

interface PageProps extends PropsWithChildren {
  className?: string
}

export default function Page(props: PageProps) {
  const { className, children } = props
  return <div className={clsx(styles.root, className)}>{children}</div>
}

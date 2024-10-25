import Image from 'next/image'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/lib/ui/Breadcrumb'
import HomeIcon from './HomeIcon'
import DateSelect from '@/lib/ui/DateSelect'
import { Days } from '@/lib/ui/DateSelect/dates'
import styles from './ContributorHeader.module.scss'

type ContributorHeaderProps = {
  days?: Days
  user: {
    name: string
    username: string
    image?: string
  }
}

export default function ContributorHeader({
  days = '7',
  user: { name, username, image },
}: ContributorHeaderProps) {
  return (
    <div className={styles.header}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">
              <HomeIcon />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/contributors">Contributors</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className={styles.main}>
        <div className={styles.profile}>
          <div className={styles['profile-img']}>
            {image && <Image fill src={image} alt={name} sizes="750px" />}
            <span data-active={true} className={styles['profile-tag']} />
          </div>
          <div className={styles['profile-details']}>
            <p>{name}</p>
            <p>{username}</p>
          </div>
        </div>

        <DateSelect slug="contributor" days={days} />
      </div>
    </div>
  )
}

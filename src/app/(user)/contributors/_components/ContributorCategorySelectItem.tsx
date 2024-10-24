'use client'

import { PropsWithChildren } from 'react'
import { parseAsInteger, parseAsStringLiteral, useQueryState } from 'nuqs'
import clsx from 'clsx'
import { Button } from '@/lib/ui/HomieButton'
import styles from '@/app/(user)/contributors/_components/ContributorCategorySelect.module.scss'

export const contributorCategories = [
  'none',
  'low_on_tasks',
  'no_tasks',
] as const

export type ContributorCategory = (typeof contributorCategories)[number]

const contributorCategoryParser = parseAsStringLiteral(contributorCategories)

interface ContributorFilterItemProps extends PropsWithChildren {
  value: ContributorCategory
}

export default function ContributorCategorySelectItem(
  props: ContributorFilterItemProps,
) {
  const { value, children } = props

  const [category, setCategory] = useQueryState('category', {
    ...contributorCategoryParser.withDefault('none'),
    shallow: false,
  })

  const [_page, setPage] = useQueryState('page', {
    ...parseAsInteger,
    shallow: false,
  })

  return (
    <div key={value} className={styles.item}>
      <Button
        variant="ghost"
        className={clsx(styles.action, {
          [styles['action--active']]: category === value,
        })}
        onClick={() => {
          setPage(null)
          setCategory(value)
        }}
      >
        {children}
      </Button>
    </div>
  )
}

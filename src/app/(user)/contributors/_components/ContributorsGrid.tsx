import React from 'react'
import ContributorCard from '@/app/(user)/contributors/_components/ContributorCard'
import styles from './ContributorsGrid.module.scss'
import { GetContributorsData } from '@/app/(user)/contributors/_utils/get-contributors'

type ContributorsGridProps = {
  contributors: GetContributorsData
}

export default function ContributorsGrid(props: ContributorsGridProps) {
  const { contributors } = props

  return (
    <div className={styles.main}>
      <div className={styles.content}>
        {contributors.map((contributor, index) => (
          <ContributorCard key={index} contributor={contributor} />
        ))}
      </div>
    </div>
  )
}

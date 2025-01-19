'use client'

import { GetContributorsData } from '@/app/(user)/contributors/_utils/get-contributors'
import { getCurrentTime } from '@/lib/utils'
import { formatInTimeZone } from 'date-fns-tz'
import { useEffect, useState } from 'react'

interface ContributorTimeProps {
  contributor: GetContributorsData[number]
}

export default function ContributorTime(props: ContributorTimeProps) {
  const { contributor } = props
  const { timezone } = contributor

  const [currentTime, setCurrentTime] = useState(
    contributor.timezone ? getCurrentTime(contributor.timezone) : null,
  )

  useEffect(() => {
    const interval = setInterval(() => {
      if (!timezone) {
        return
      }

      setCurrentTime(getCurrentTime(timezone))
    }, 60000)

    return () => clearInterval(interval)
  }, [timezone])

  if (!currentTime) {
    return <p>-</p>
  }

  const utcOffset = timezone
    ? formatInTimeZone(new Date(), timezone, 'x').replace(':00', '')
    : ''

  const utcLabel = timezone === 'UTC' ? 'UTC' : `UTC${utcOffset}`

  return (
    <p>
      <span>{currentTime}</span> <span>{utcLabel}</span>{' '}
    </p>
  )
}

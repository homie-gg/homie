'use client'

import { getCurrentTime } from '@/lib/utils'
import { formatInTimeZone } from 'date-fns-tz'
import { useEffect, useState } from 'react'

interface CurrentTimeProps {
  timezone?: string
}

export default function CurrentTime(props: CurrentTimeProps) {
  const { timezone } = props

  const [currentTime, setCurrentTime] = useState(
    timezone ? getCurrentTime(timezone) : null,
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
    return <span>-</span>
  }

  const utcOffset = timezone
    ? formatInTimeZone(new Date(), timezone, 'x').replace(':00', '')
    : ''

  const utcLabel = timezone === 'UTC' ? 'UTC' : `UTC${utcOffset}`

  return (
    <>
      <span>{currentTime}</span> <span>{utcLabel}</span>{' '}
    </>
  )
}

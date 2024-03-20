'use client'

import { usePullRequests } from '@/app/(user)/review/_components/PullRequestsProvider'
import { addDays, differenceInDays, format, isSameDay } from 'date-fns'
import { useEffect, useState } from 'react'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type Entry = { date: string; count: number }

export function OpenedPRsChart() {
  const { date, pullRequests } = usePullRequests()

  const [data, setData] = useState<Entry[]>([])

  const startDate = date?.from?.toISOString()
  const endDate = date?.to?.toISOString()

  useEffect(() => {
    if (!startDate || !endDate) {
      return
    }

    const numDays = differenceInDays(endDate, startDate)

    const dates = Array.from({ length: numDays }).map((_, index) => {
      return addDays(startDate, index)
    })

    const current: Entry[] = dates.map((date) => ({
      date: format(date, 'MMM dd'),
      count: pullRequests.filter((pr) => isSameDay(pr.created_at, date)).length,
    }))

    setData(current)
  }, [startDate, endDate, pullRequests])

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <Line
          type="monotone"
          strokeWidth={1}
          stroke="#888888"
          dataKey="count"
          legendType="none"
          activeDot={{
            r: 2,
          }}
        />
        <XAxis
          dataKey="date"
          className="text-xs"
          tick={{
            opacity: 0.6,
          }}
          strokeOpacity={0.6}
        />
        <YAxis
          className="text-xs"
          tick={{
            opacity: 0.6,
          }}
          strokeOpacity={0.6}
        />
        <Tooltip />
      </LineChart>
    </ResponsiveContainer>
  )
}

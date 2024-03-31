'use client'

import { PullRequest } from '@/app/(user)/review/_utils/get-pull-requests'
import {
  addDays,
  differenceInDays,
  endOfDay,
  format,
  isSameDay,
} from 'date-fns'
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

interface OpenedPRsChartProps {
  pullRequests: PullRequest[]
  startDate: Date
  endDate: Date
}

export function OpenedPRsChart(props: OpenedPRsChartProps) {
  const { pullRequests } = props

  const [data, setData] = useState<Entry[]>([])

  const startDate = props.startDate.toISOString()
  const endDate = addDays(props.endDate, 1).toISOString()

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

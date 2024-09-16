'use client'

import { AreaChart, XAxis, YAxis, Area, CartesianGrid } from 'recharts'

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/lib/ui/Chart'
import styles from './PullRequestsCountsCharts.module.scss'
import { useEffect, useState } from 'react'
import { addDays, differenceInDays, format, isSameDay } from 'date-fns'
import { PullRequest } from '@/app/(user)/dashboard/_utils/get-pull-requests'

const chartConfig = {
  data: {
    label: 'Pull Requests',
    color: 'hsl(var(--green))',
  },
} satisfies ChartConfig

interface PullRequestsCountsChartsProps {
  pullRequests: PullRequest[]
  startDate: Date
  endDate: Date
}

type Entry = { date: string; count: number }

export default function PullRequestsCountsChart(
  props: PullRequestsCountsChartsProps,
) {
  const { pullRequests, startDate, endDate } = props
  const [data, setData] = useState<Entry[]>([])

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
    <div className={styles.main}>
      <p className={styles.heading}>Pull Requests</p>
      <div>
        <ChartContainer config={chartConfig} className={styles.container}>
          <AreaChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} strokeDasharray="12 12" />
            <defs>
              <linearGradient id="color" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3dc76d" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3dc76d" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              fontSize={12}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--color-data)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#color)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
        <p className={styles['axis-label']}>Days</p>
      </div>
    </div>
  )
}

'use client'

import { AreaChart, XAxis, YAxis, Area, CartesianGrid } from 'recharts'

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/lib/ui/Chart'
import styles from './PullRequestCharts.module.scss'

const chartConfig = {
  data: {
    label: 'Pull Requests',
    color: 'hsl(var(--green))',
  },
} satisfies ChartConfig

export const pullRequestsData = [
  {
    day: 'Aug 17',
    data: 15,
  },
  {
    day: 'Aug 18',
    data: 17,
  },
  {
    day: 'Aug 19',
    data: 21,
  },
  {
    day: 'Aug 20',
    data: 25,
  },
  {
    day: 'Aug 21',
    data: 23,
  },
  {
    day: 'Aug 22',
    data: 28,
  },
  {
    day: 'Aug 23',
    data: 29,
  },
]

export default function PullRequestsChart() {
  return (
    <div className={styles.main}>
      <p className={styles.heading}>Pull Requests</p>
      <div>
        <ChartContainer config={chartConfig} className={styles.container}>
          <AreaChart accessibilityLayer data={pullRequestsData}>
            <CartesianGrid vertical={false} strokeDasharray="12 12" />
            <defs>
              <linearGradient id="color" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3dc76d" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3dc76d" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              fontSize={12}
            />
            <YAxis
              width={
                pullRequestsData
                  .map((c) => c.data)
                  .reduce(
                    (acc, cur) =>
                      cur.toString().length > acc ? cur.toString().length : acc,
                    0,
                  ) * 16
              }
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
              dataKey="data"
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

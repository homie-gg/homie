'use client'

import { AreaChart, XAxis, Area, CartesianGrid } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/lib/ui/Chart'
import styles from './PeriodChart.module.scss'

const chartConfig = {
  current: {
    label: 'Current period',
    color: 'hsl(var(--success-secondary))',
  },
  previous: {
    label: 'Previous period',
    color: 'hsl(var(--quinary-foreground))',
  },
} satisfies ChartConfig

export type PeriodChartData = {
  day: string
  current: number
  previous: number
}[]

type PeriodChartProps = {
  data: PeriodChartData
  xOrientation?: 'top' | 'bottom'
}

export default function PeriodChart({
  data,
  xOrientation = 'bottom',
}: PeriodChartProps) {
  return (
    <div className={styles.chart}>
      <ul className={styles.legend}>
        <li data-period="current">Current period</li>
        <li data-period="previous">Previous period</li>
      </ul>
      <ChartContainer config={chartConfig}>
        <AreaChart accessibilityLayer data={data}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            orientation={xOrientation}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Area
            dataKey="current"
            type="bump"
            fill="none"
            stroke="var(--color-current)"
            strokeWidth={2}
            stackId="c"
          />
          <Area
            dataKey="previous"
            type="bump"
            fill="none"
            stroke="var(--color-previous)"
            strokeWidth={2}
            stackId="p"
          />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}

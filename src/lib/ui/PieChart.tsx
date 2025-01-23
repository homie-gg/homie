import React from 'react'
import { Pie, PieChart as RechartsPieChart } from 'recharts'
import clsx from 'clsx'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/lib/ui/Chart'
import styles from './PieChart.module.scss'

export interface PieChartProps {
  data: {
    label: string
    count: number
    fill?: string
  }[]
  className?: string
  innerRadius?: number
}

export default function PieChart(props: PieChartProps) {
  const { data, className, innerRadius } = props

  const dataWithColor = data.map((entry, index) => ({
    index: `entry_${index}`,
    label: entry.label,
    count: entry.count,
    fill: entry.fill ?? `var(--chart-${(index % 17) + 1})`, // 16 colors in globals.scss so %17 = 0..16
  }))

  const config = data.reduce(
    (acc, i, index) => {
      acc[`entry_${index}`] = {
        label: i.label,
      }

      return acc
    },
    {} as Record<string, { label: string }>,
  )

  return (
    <div className={clsx(styles.main, className)}>
      <ChartContainer config={config} className={styles.container}>
        <RechartsPieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Pie
            cx="50%"
            cy="50%"
            data={dataWithColor}
            dataKey="count"
            nameKey="index"
            innerRadius={innerRadius}
          />
          <ChartLegend
            content={<ChartLegendContent nameKey="index" />}
            className={styles.legend}
          />
        </RechartsPieChart>
      </ChartContainer>
    </div>
  )
}

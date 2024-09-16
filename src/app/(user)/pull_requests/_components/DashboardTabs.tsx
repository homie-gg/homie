'use client'

import { getDashboardUrl } from '@/app/(user)/pull_requests/_utils/get-dashboard-url'
import { TabsProps, Root } from '@radix-ui/react-tabs'
import { useRouter } from 'next/navigation'

type ReviewTabsProps = TabsProps & {
  startDate: Date
  endDate: Date
}

export default function DashboardTabs(props: ReviewTabsProps) {
  const { startDate, endDate, ...tabProps } = props

  const router = useRouter()

  const goToTab = (tab: string) => {
    router.push(
      getDashboardUrl({
        tab,
        startDate,
        endDate,
      }),
    )
  }
  return <Root {...tabProps} onValueChange={goToTab} />
}

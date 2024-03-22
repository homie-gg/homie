'use client'

import { setReviewUrl } from '@/app/(user)/review/_utils/set-review-url'
import { TabsProps, Root } from '@radix-ui/react-tabs'

type ReviewTabsProps = TabsProps & {
  startDate: Date
  endDate: Date
}

export default function ReviewTabs(props: ReviewTabsProps) {
  const { startDate, endDate, ...tabProps } = props

  const goToTab = (tab: string) => {
    setReviewUrl({
      tab,
      startDate,
      endDate,
    })
  }
  return <Root {...tabProps} onValueChange={goToTab} />
}

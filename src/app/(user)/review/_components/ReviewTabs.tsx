'use client'

import { getReviewUrl } from '@/app/(user)/review/_utils/set-review-url'
import { TabsProps, Root } from '@radix-ui/react-tabs'
import { useRouter } from 'next/navigation'

type ReviewTabsProps = TabsProps & {
  startDate: Date
  endDate: Date
}

export default function ReviewTabs(props: ReviewTabsProps) {
  const { startDate, endDate, ...tabProps } = props

  const router = useRouter()

  const goToTab = (tab: string) => {
    router.push(
      getReviewUrl({
        tab,
        startDate,
        endDate,
      }),
    )
  }
  return <Root {...tabProps} onValueChange={goToTab} />
}

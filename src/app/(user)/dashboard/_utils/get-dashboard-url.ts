import { format } from 'date-fns'

interface GetReviewUrlParams {
  startDate: Date
  endDate: Date
  tab: string
}

export function getDashboardUrl(params: GetReviewUrlParams) {
  const { startDate, endDate, tab } = params

  const formattedFrom = format(startDate, 'yyyy-MM-dd')
  const formattedTo = format(endDate, 'yyyy-MM-dd')

  return `/dashboard?tab=${tab}&from=${formattedFrom}&to=${formattedTo}`
}

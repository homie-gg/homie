import { format } from 'date-fns'

interface GetReviewUrlParams {
  startDate: Date
  endDate: Date
  tab: string
}

export function getReviewUrl(params: GetReviewUrlParams) {
  const { startDate, endDate, tab } = params

  const formattedFrom = format(startDate, 'yyyy-MM-dd')
  const formattedTo = format(endDate, 'yyyy-MM-dd')

  return `/review?tab=${tab}&from=${formattedFrom}&to=${formattedTo}`
}

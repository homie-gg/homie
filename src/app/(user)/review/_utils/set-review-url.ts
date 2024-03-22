import { format } from 'date-fns'

interface SetReviewUrlParams {
  startDate: Date
  endDate: Date
  tab: string
}

export function setReviewUrl(params: SetReviewUrlParams) {
  const { startDate, endDate, tab } = params

  const formattedFrom = format(startDate, 'yyyy-MM-dd')
  const formattedTo = format(endDate, 'yyyy-MM-dd')

  window.location.href = `/review?tab=${tab}&from=${formattedFrom}&to=${formattedTo}`
}

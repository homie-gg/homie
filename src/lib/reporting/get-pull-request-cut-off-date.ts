import { subHours } from 'date-fns'

interface GetPullRequestCutoffDateParams {
  organization: {
    send_pull_request_summaries_interval: string
    send_pull_request_summaries_day: string
    send_pull_request_summaries_time: string
  }
}

export function getPullRequestCutoffDate(
  params: GetPullRequestCutoffDateParams,
) {
  const { organization } = params
  const { send_pull_request_summaries_interval } = organization

  if (send_pull_request_summaries_interval === 'daily') {
    return subHours(new Date(), 24)
  }

  return subHours(new Date(), 168) // 24 * 7 (Days)
}

import { subDays } from 'date-fns'

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
    return subDays(new Date(), 1)
  }

  return subDays(new Date(), 7)
}

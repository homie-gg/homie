import { http } from '@/lib/http/client/http'
import { SlackAccessTokenResponse } from '@/lib/slack/types'

interface GetAccessTokenParams {
  code: string
}

export async function GetAccessToken(
  params: GetAccessTokenParams,
): Promise<SlackAccessTokenResponse> {
  const { code } = params

  const data = new FormData()

  data.append('code', code)
  data.append('client_id', process.env.SLACK_CLIENT_ID!)
  data.append('client_secret', process.env.SLACK_CLIENT_SECRET!)

  return http.post<SlackAccessTokenResponse>(
    'https://slack.com/api/oauth.v2.access',
    data,
  )
}

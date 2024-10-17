const appScopes = [
  'app_mentions:read',
  'channels:history',
  'chat:write',
  'commands',
  'groups:history',
  'incoming-webhook',
  'users:read',
  'im:history',
  'mpim:history',
]

const baseUrl = 'https://slack.com/oauth/v2/authorize'

const userScopes: string[] = []

interface GetSlackInstallUrlParams {
  organization: {
    id: number
  }
}

export function getSlackInstallUrl(params: GetSlackInstallUrlParams) {
  const { organization } = params

  const searchParams = [
    `client_id=${process.env.NEXT_PUBLIC_SLACK_CLIENT_ID}`,
    `scope=${appScopes.join(',')}`,
    `user_scope=${userScopes.join(',')}`,
    `state=${organization.id}`,
  ]

  return `${baseUrl}?${searchParams.join('&')}`
}

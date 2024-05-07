const appScopes = [
  'app_mentions:read',
  'channels:history',
  'chat:write',
  'commands',
  'groups:history',
  'incoming-webhook',
  'users:read',
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
    `client_id=${process.env.SLACK_CLIENT_ID}`,
    `scope=${appScopes.join(',')}`,
    `user_scope=${userScopes.join(',')}`,
    `state=${organization.id}`,
  ]

  return `${baseUrl}?${searchParams.join('&')}`
}
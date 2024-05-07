const scopes = ['read_user', 'write_repository', 'api']
const baseUrl = 'https://gitlab.com/oauth/authorize'
const redirectUrl = encodeURI(`${process.env.NEXT_PUBLIC_APP_URL}/gitlab/setup`)

interface getGitlabInstallUrlParams {
  organization: {
    id: number
  }
}

export function getGitlabInstallUrl(params: getGitlabInstallUrlParams) {
  const { organization } = params

  const searchParams = [
    `client_id=${process.env.GITLAB_APP_ID}`,
    `redirect_uri=${redirectUrl}`,
    `response_type=code`,
    `state=${organization.id}`,
    `scope=${scopes.join('+')}`,
  ]

  return `${baseUrl}?${searchParams.join('&')}`
}

interface GetGithubInstallUrl {
  organization: {
    id: number
  }
}

export function getGithubInstallUrl(params: GetGithubInstallUrl) {
  const { organization } = params

  const baseUrl = `https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_NAME}/installations/new`
  const searchParams = [`state=${organization.id}`]

  return `${baseUrl}?${searchParams.join('&')}`
}

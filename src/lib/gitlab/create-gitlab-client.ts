import { Gitlab } from '@gitbeaker/rest'

export const createGitlabClient = (accessToken: string) =>
  new Gitlab({
    host: 'https://gitlab.com',
    oauthToken: accessToken,
  })

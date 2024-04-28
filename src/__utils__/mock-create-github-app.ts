import { createGithubApp } from '@/lib/github/create-github-app'

jest.mock('lib/github/create-github-app')

export const mockCreateGithubApp = createGithubApp as jest.Mock

import { createGithubClient } from '@/lib/github/create-github-client'

jest.mock('lib/github/create-github-client')

export const mockCreateGithubClient = createGithubClient as jest.Mock

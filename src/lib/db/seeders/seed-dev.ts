import { faker } from '@faker-js/faker'

import ms from 'ms'
import { dbClient } from '@/lib/db/client'
import { GithubRepo, GithubUser, Organization } from '@/lib/db/types'
;(async () => {
  const organization = await dbClient
    .selectFrom('voidpm.organization')
    .selectAll()
    .executeTakeFirstOrThrow()

  const users = await seedGithubUsers(organization)
  const repos = await seedGithubRepos(organization)

  for (const user of users) {
    await seedPullRequests(repos, user)
  }

  await dbClient.destroy()

  // eslint-disable-next-line no-console
  console.log('Dev data seeded')
})()

async function seedGithubUsers(
  organization: Organization,
): Promise<GithubUser[]> {
  return await Promise.all(
    Array.from({ length: 20 }).map(
      async (_, index) =>
        await dbClient
          .insertInto('github.user')
          .values({
            organization_id: organization.id,
            ext_gh_user_id: index + 800,
            username: faker.internet.userName(),
          })
          .returningAll()
          .executeTakeFirstOrThrow(),
    ),
  )
}

async function seedGithubRepos(
  organization: Organization,
): Promise<GithubRepo[]> {
  return await Promise.all(
    Array.from({ length: 2 }).map(
      async (_, index) =>
        await dbClient
          .insertInto('github.repo')
          .values({
            organization_id: organization.id,
            name: `repo-${index}`,
            html_url: `https://github.com/void/repo-${index}`,
            ext_gh_repo_id: index + 1,
          })
          .returningAll()
          .executeTakeFirstOrThrow(),
    ),
  )
}

async function seedPullRequests(repos: GithubRepo[], user: GithubUser) {
  const numPullRequests = generateRandomNumber(1, 10)

  return Promise.all(
    Array.from({ length: numPullRequests }).map(async (_, index) => {
      const repo = repos[generateRandomNumber(1, repos.length) - 1]
      const ghPullRequestId = user.id * 100 + index

      const createdDaysAgo = generateRandomNumber(1, 14)

      const closedDaysAgo = generateRandomNumber(1, createdDaysAgo - 1)

      const wasClosed = closedDaysAgo > 0 && generateRandomBool(0.2)
      const wasMerged = !wasClosed && generateRandomBool()

      return dbClient
        .insertInto('github.pull_request')
        .values({
          created_at: new Date(Date.now() - ms(`${createdDaysAgo} days`)),
          ext_gh_pull_request_id: ghPullRequestId,
          html_url: `https://github.com/void-pm/void/pull/${ghPullRequestId}`,
          title: `Fake PR: ${ghPullRequestId}`,
          repo_id: repo.id,
          user_id: user.id,
          organization_id: user.organization_id,
          closed_at: wasClosed
            ? new Date(Date.now() - ms(`${closedDaysAgo} days`))
            : undefined,
          merged_at: wasMerged
            ? new Date(Date.now() - ms(`${closedDaysAgo} days`))
            : undefined,
        })
        .returningAll()
        .executeTakeFirstOrThrow()
    }),
  )
}

/**
 * Generate a random number between 2 integers.
 */
function generateRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function generateRandomBool(chance: number = 0.5): boolean {
  return Math.random() < chance
}

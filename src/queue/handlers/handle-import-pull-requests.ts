import { embedGithubPullRequest } from '@/lib/ai/embed-github-pull-request'
import { summarizeGithubPullRequest } from '@/lib/ai/summarize-github-pull-request'
import { dbClient } from '@/lib/db/client'
import { createGithubClient } from '@/lib/github/create-github-client'
import { findLinkedIssue } from '@/lib/github/find-linked-issue'
import { ImportPullRequests } from '@/queue/jobs'
import { parseISO } from 'date-fns'

export async function handleImportPullRequests(job: ImportPullRequests) {
  const { github_organization } = job.data

  const organization = await dbClient
    .selectFrom('voidpm.organization')
    .innerJoin(
      'github.organization',
      'github.organization.organization_id',
      'voidpm.organization.id',
    )
    .where('ext_gh_install_id', '=', github_organization.ext_gh_install_id)
    .select(['voidpm.organization.id', 'github.organization.ext_gh_install_id'])
    .executeTakeFirst()

  if (!organization) {
    return
  }

  const github = await createGithubClient({
    installationId: github_organization.ext_gh_install_id,
  })

  const repos = await github.request('GET /installation/repositories', {
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  for (const repo of repos.data.repositories) {
    const owner = repo.full_name.split('/')[0] // repo is full name. e.g. 'octocat/hello-world'

    const prs = await github.rest.pulls.list({
      state: 'closed',
      sort: 'updated',
      direction: 'desc',
      per_page: 20,
      repo: repo.name,
      owner,
    })

    for (const pullRequest of prs.data) {
      if (!pullRequest.merged_at) {
        // unmerged
        continue
      }

      const mergedToDefault =
        pullRequest.base.ref === pullRequest.base.repo.default_branch
      if (!mergedToDefault) {
        return
      }

      if (!pullRequest.user) {
        return
      }

      // Create Github User if doesn't exits
      const githubUser = await dbClient
        .insertInto('github.user')
        .values({
          ext_gh_user_id: pullRequest.user.id,
          organization_id: organization.id,
          username: pullRequest.user.login ?? '',
        })
        .onConflict((oc) =>
          oc.column('ext_gh_user_id').doUpdateSet({
            organization_id: organization.id,
            username: pullRequest.user?.login ?? '',
          }),
        )
        .returning('id')
        .executeTakeFirstOrThrow()

      const repo = await dbClient
        .insertInto('github.repo')
        .values({
          organization_id: organization.id,
          name: pullRequest.base.repo.name,
          html_url: pullRequest.base.repo.html_url,
          ext_gh_repo_id: pullRequest.base.repo.id,
        })
        .onConflict((oc) =>
          oc.column('ext_gh_repo_id').doUpdateSet({
            organization_id: organization.id,
            name: pullRequest.base.repo.name,
            html_url: pullRequest.base.repo.html_url,
          }),
        )
        .returning('id')
        .executeTakeFirstOrThrow()

      const issue = await findLinkedIssue({
        pullRequest,
        repo: pullRequest.base.repo.name,
        owner,
        github,
      })

      const summary = await summarizeGithubPullRequest({
        pullRequest: {
          body: pullRequest.body,
          repo_id: pullRequest.base.repo.id,
          pull_number: pullRequest.number,
        },
        repo: pullRequest.base.repo.name,
        owner,
        github,
        issue: issue?.body ?? null,
        user_id: githubUser.id,
      })

      if (!summary) {
        return
      }

      const pullRequestRecord = await dbClient
        .insertInto('github.pull_request')
        .values({
          created_at: parseISO(pullRequest.created_at),
          ext_gh_pull_request_id: pullRequest.id,
          organization_id: organization.id,
          user_id: githubUser.id,
          title: pullRequest.title,
          html_url: pullRequest.html_url,
          repo_id: repo.id,
          body: pullRequest.body ?? '',
          merged_at: parseISO(pullRequest.merged_at),
          summary,
          number: pullRequest.number,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      await embedGithubPullRequest({ pullRequest: pullRequestRecord })
    }
  }
}

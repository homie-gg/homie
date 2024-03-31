import { dbClient } from '@/lib/db/client'
import { createGithubClient } from '@/lib/github/create-github-client'
import { saveMergedPullRequest } from '@/lib/github/save-merged-pull-request'
import { ImportPullRequests } from '@/queue/jobs'

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
      if (!pullRequest.user) {
        continue
      }

      await saveMergedPullRequest({
        pullRequest: {
          user: {
            id: pullRequest.user.id,
            login: pullRequest.user.login,
          },
          merged_at: pullRequest.merged_at,
          body: pullRequest.body,
          id: pullRequest.id,
          title: pullRequest.title,
          html_url: pullRequest.html_url,
          number: pullRequest.number,
          created_at: pullRequest.created_at,
          base: {
            repo: pullRequest.base.repo,
            ref: pullRequest.base.ref,
          },
        },
        organization,
      })
    }
  }
}

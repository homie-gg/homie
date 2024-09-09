import { createJob } from '@/queue/create-job'
import { dbClient } from '@/database/client'
import { createGithubClient } from '@/lib/github/create-github-client'
import { dispatch } from '@/queue/dispatch'
import { GithubOrganization } from '@/database/types'

export const importGithubIssues = createJob({
  id: 'import_github_issues',
  handle: async (payload: { github_organization: GithubOrganization }) => {
    const { github_organization } = payload

    const organization = await dbClient
      .selectFrom('homie.organization')
      .innerJoin(
        'github.organization',
        'github.organization.organization_id',
        'homie.organization.id',
      )
      .where('ext_gh_install_id', '=', github_organization.ext_gh_install_id)
      .select([
        'homie.organization.id',
        'github.organization.ext_gh_install_id',
      ])
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

      const issues = await github.rest.issues.listForRepo({
        repo: repo.name,
        owner,
        state: 'open',
      })

      for (const issue of issues.data) {
        // Every PR is also an issue. Since we don't want to import PRs here, check to
        // see if an issue is actually a PR.
        // Reference: https://docs.github.com/en/rest/issues/issues?apiVersion=2022-11-28#list-repository-issues
        if (issue.pull_request) {
          continue
        }

        if (issue.user === null || issue.user.name === null) {
          continue
        }

        if (!issue.user || !issue.user.login) {
          continue
        }

        await dispatch('create_homie_task_from_github_issue', {
          issue,
          installation: {
            id: github_organization.ext_gh_install_id,
          },
          repository: repo,
        })
      }
    }
  },
})

import { createJob } from '@/queue/create-job'
import { dbClient } from '@/database/client'
import { createGithubClient } from '@/lib/github/create-github-client'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { getPullRequestLogData } from '@/lib/github/get-pull-request-log-data'
import { logger } from '@/lib/log/logger'
import { GithubOrganization } from '@/database/types'
import { saveMergedPullRequest } from '@/queue/jobs/save-merged-pull-request'

export const importPullRequests = createJob({
  id: 'import_pull_requests',
  handle: async (payload: { github_organization: GithubOrganization }) => {
    {
      const { github_organization } = payload

      logger.debug('Start pull request import', {
        event: 'import_pull_requests.start',
        organization: {
          id: github_organization.organization_id,
          ext_gh_install_id: github_organization.ext_gh_install_id,
        },
      })

      const organization = await dbClient
        .selectFrom('homie.organization')
        .innerJoin(
          'github.organization',
          'github.organization.organization_id',
          'homie.organization.id',
        )
        .leftJoin(
          'trello.workspace',
          'trello.workspace.organization_id',
          'homie.organization.id',
        )
        .leftJoin(
          'asana.app_user',
          'asana.app_user.organization_id',
          'homie.organization.id',
        )
        .where('ext_gh_install_id', '=', github_organization.ext_gh_install_id)
        .select([
          'homie.organization.id',
          'github.organization.ext_gh_install_id',
          'trello_access_token',
          'asana_access_token',
        ])
        .executeTakeFirst()

      if (!organization) {
        logger.debug('Missing organization - abort', {
          event: 'import_pull_requests.missing_organization',
          organization: {
            id: github_organization.organization_id,
            ext_gh_install_id: github_organization.ext_gh_install_id,
          },
        })

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
            logger.debug('Missing pull request user - skipping', {
              event: 'import_pull_requests.missing_user',
              organization: getOrganizationLogData(organization),
              pull_request: getPullRequestLogData(pullRequest),
            })
            continue
          }

          await saveMergedPullRequest.dispatch({
            pull_request: {
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
              head: {
                ref: pullRequest.head.ref,
              },
              base: {
                repo: pullRequest.base.repo,
                ref: pullRequest.base.ref,
              },
            },
            installation: {
              id: github_organization.ext_gh_install_id,
            },
          })
        }
      }
    }
  },
})

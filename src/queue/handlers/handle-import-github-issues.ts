import { dbClient } from '@/database/client'
import { createGithubClient } from '@/lib/github/create-github-client'
import { ImportGithubIssues } from '@/queue/jobs'
import { createTaskFromGithubIssue } from '@/lib/github/create-task-from-github-issue'
import { classifyTask } from '@/lib/ai/clasify-task'

export async function handleImportGithubIssues(job: ImportGithubIssues) {
  const { github_organization } = job.data

  const organization = await dbClient
    .selectFrom('homie.organization')
    .innerJoin(
      'github.organization',
      'github.organization.organization_id',
      'homie.organization.id',
    )
    .where('ext_gh_install_id', '=', github_organization.ext_gh_install_id)
    .select(['homie.organization.id', 'github.organization.ext_gh_install_id'])
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
      const { task_type_id, priority_level } = await classifyTask({
        title: issue.title,
        description: issue.body ?? '',
      })

      await createTaskFromGithubIssue({
        issue,
        task_type_id,
        priority_level,
        organization,
        repository: repo,
      })
    }
  }
}

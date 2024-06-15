import { dbClient } from '@/database/client'
import { InstallationLite, Issue } from '@octokit/webhooks-types'

interface DeleteTaskFromGithubIssueParams {
  issue: Issue
  installation?: InstallationLite | undefined
}

export async function deleteTaskFromGithubIssue(
  params: DeleteTaskFromGithubIssueParams,
) {
  const { installation, issue } = params

  if (!installation) {
    return
  }

  const organization = await dbClient
    .selectFrom('homie.organization')
    .innerJoin(
      'github.organization',
      'github.organization.organization_id',
      'homie.organization.id',
    )
    .where('ext_gh_install_id', '=', installation?.id!)
    .select(['homie.organization.id', 'github.organization.ext_gh_install_id'])
    .executeTakeFirst()

  if (!organization) {
    return
  }

  await dbClient
    .deleteFrom('homie.task')
    .where('ext_gh_issue_id', '=', issue.id)
    .execute()
}

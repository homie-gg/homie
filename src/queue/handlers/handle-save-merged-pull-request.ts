import { dbClient } from '@/lib/db/client'
import { saveMergedPullRequest } from '@/lib/github/save-merged-pull-request'
import { SaveMergedPullRequest } from '@/queue/jobs'

export async function handleSaveMergedPullRequest(job: SaveMergedPullRequest) {
  const { pull_request, installation } = job.data

  const organization = await dbClient
    .selectFrom('voidpm.organization')
    .innerJoin(
      'github.organization',
      'github.organization.organization_id',
      'voidpm.organization.id',
    )
    .where('ext_gh_install_id', '=', installation?.id!)
    .select(['voidpm.organization.id', 'github.organization.ext_gh_install_id'])
    .executeTakeFirst()

  if (!organization) {
    return
  }

  await saveMergedPullRequest({
    pullRequest: pull_request,
    organization,
  })
}

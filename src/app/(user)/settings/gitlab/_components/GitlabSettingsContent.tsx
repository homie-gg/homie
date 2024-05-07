import { dbClient } from '@/database/client'
import { getUserOrganization } from '@/lib/auth/get-user-organization'
import { redirect } from 'next/navigation'
import InstallGitlabPage from '@/app/(user)/settings/gitlab/_components/InstallGitlabPage'
import GitlabProjectsList from '@/app/(user)/settings/gitlab/_components/GitlabProjectsList'

export default async function GitlabSettingsContent() {
  const organization = await getUserOrganization()

  if (!organization) {
    return redirect('/')
  }

  const gitlabAppUser = await dbClient
    .selectFrom('gitlab.app_user')
    .where('organization_id', '=', organization.id)
    .select(['id', 'gitlab.app_user.gitlab_access_token'])
    .executeTakeFirst()

  if (!gitlabAppUser) {
    return <InstallGitlabPage organization={organization} />
  }

  return (
    <GitlabProjectsList
      organization={organization}
      gitlabAppUser={gitlabAppUser}
    />
  )
}

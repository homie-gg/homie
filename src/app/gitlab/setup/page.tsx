import { dbClient } from '@/database/client'
import { generateRandomToken } from '@/lib/crypto/generate-random-token'
import { GitlabOAuthTokenResponse } from '@/lib/gitlab/types'
import { http } from '@/lib/http/client/http'
import { PageProps } from '@/lib/next-js/page-props'
import { importGitlabProjects } from '@/queue/jobs/import-gitlab-projects'
import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

type GitlabSetupPageProps = PageProps<
  {},
  {
    code: string
    state: string
  }
>

export default async function GitlabSetupPage(props: GitlabSetupPageProps) {
  const {
    searchParams: { code, state: organization_id },
  } = props

  const { userId } = auth()

  if (!userId) {
    redirect('/')
  }

  const organization = await dbClient
    .selectFrom('homie.organization')
    .where('homie.organization.id', '=', parseInt(organization_id))
    .where('ext_clerk_user_id', '=', userId)
    .select('id')
    .executeTakeFirst()

  if (!organization) {
    return redirect('/')
  }

  const data = await http.post<GitlabOAuthTokenResponse>(
    'https://gitlab.com/oauth/token',
    {
      client_id: process.env.GITLAB_APP_ID,
      code,
      grant_type: 'authorization_code',
      redirect_uri: encodeURI(
        `${process.env.NEXT_PUBLIC_APP_URL}/gitlab/setup`,
      ),
    },
  )

  const gitlabAppUser = await dbClient
    .insertInto('gitlab.app_user')
    .values({
      gitlab_access_token: data.access_token,
      gitlab_refresh_token: data.refresh_token,
      organization_id: organization.id,
      gitlab_webhook_secret: generateRandomToken(),
    })
    .returning([
      'gitlab_access_token',
      'organization_id',
      'gitlab_webhook_secret',
    ])
    .executeTakeFirstOrThrow()

  await importGitlabProjects.dispatch({
    organization: {
      id: organization.id,
      gitlab_access_token: gitlabAppUser.gitlab_access_token,
      gitlab_webhook_secret: gitlabAppUser.gitlab_webhook_secret,
    },
  })

  return redirect('/review')
}

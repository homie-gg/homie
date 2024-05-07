import { dbClient } from '@/database/client'
import { generateRandomToken } from '@/lib/crypto/generate-random-token'
import { GitlabOAuthTokenResponse } from '@/lib/gitlab/types'
import { http } from '@/lib/http/client/http'
import { PageProps } from '@/lib/next-js/page-props'
import { dispatch } from '@/queue/default-queue'
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
    .selectFrom('voidpm.organization')
    .where('voidpm.organization.id', '=', parseInt(organization_id))
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

  await dispatch('import_gitlab_projects', {
    organization: {
      id: organization.id,
      gitlab_access_token: gitlabAppUser.gitlab_access_token,
      gitlab_webhook_secret: gitlabAppUser.gitlab_webhook_secret,
    },
  })

  // TODO:
  // - import each project
  // - register webhook
  // - pull latest X MRs per project

  // - handle webhook events for MR
  //    - save on open
  //    - handle save merged
  //    - handle generate MR summary
  //    - update on merge/close
  //    - close linked tasks
  // - update to only import selected projects

  // - ignore not enabled projects

  // - refresh token job every 2 hours

  return redirect('/review')
}

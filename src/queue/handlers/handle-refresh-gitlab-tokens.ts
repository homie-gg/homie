import { dbClient } from '@/database/client'
import { getGitlabAppUserLogData } from '@/lib/gitlab/get-gitlab-app-user-log-data'
import { GitlabOAuthTokenResponse } from '@/lib/gitlab/types'
import { http } from '@/lib/http/client/http'
import { logger } from '@/lib/log/logger'

export async function handleRefreshGitlabTokens() {
  const gitlabAppUsers = await dbClient
    .selectFrom('gitlab.app_user')
    .select([
      'id',
      'gitlab_refresh_token',
      'organization_id',
      'created_at',
      'updated_at',
    ])
    .execute()

  for (const gitlabAppUser of gitlabAppUsers) {
    try {
      const data = await http.post<GitlabOAuthTokenResponse>(
        'https://gitlab.com/oauth/token',
        {
          client_id: process.env.GITLAB_APP_ID,
          refresh_token: gitlabAppUser.gitlab_refresh_token,
          grant_type: 'refresh_token',
          redirect_uri: encodeURI(
            `${process.env.NEXT_PUBLIC_APP_URL}/gitlab/setup`,
          ),
        },
      )

      await dbClient
        .updateTable('gitlab.app_user')
        .where('id', '=', gitlabAppUser.id)
        .set({
          gitlab_access_token: data.access_token,
          gitlab_refresh_token: data.refresh_token,
        })
        .executeTakeFirstOrThrow()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : error

      logger.debug('Failed to refresh gitlab access token', {
        event: 'refresh_gitlab_access_token.failed',
        gitlab_app_user: getGitlabAppUserLogData(gitlabAppUser),
        error: errorMessage,
      })

      await dbClient
        .deleteFrom('gitlab.app_user')
        .where('id', '=', gitlabAppUser.id)
        .execute()
    }
  }
}

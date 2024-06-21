import { dbClient } from '@/database/client'
import { getAsanaOrganizationLogData } from '@/lib/asana/get-asana-organization-log-data'
import { AsanaOAuthTokenResponse } from '@/lib/asana/types'
import { http } from '@/lib/http/client/http'
import { logger } from '@/lib/log/logger'

export async function handleRefreshAsanaTokens() {
  const asanaAppUsers = await dbClient
    .selectFrom('asana.app_user')
    .select([
      'id',
      'asana_refresh_token',
      'organization_id',
      'created_at',
      'updated_at',
    ])
    .execute()

  for (const asanaAppUser of asanaAppUsers) {
    try {
      const data = new FormData()
      data.append('grant_type', 'refresh_token')
      data.append('client_id', process.env.ASANA_CLIENT_ID!)
      data.append('client_secret', process.env.ASANA_CLIENT_SECRET!)
      data.append('refresh_token', asanaAppUser.asana_refresh_token)

      const { access_token, refresh_token } =
        await http.post<AsanaOAuthTokenResponse>(
          'https://app.asana.com/-/oauth_token',
          data,
        )

      await dbClient
        .updateTable('asana.app_user')
        .where('id', '=', asanaAppUser.id)
        .set({
          asana_refresh_token: refresh_token,
          asana_access_token: access_token,
        })
        .executeTakeFirstOrThrow()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : error

      logger.debug('Failed to refresh asana access token', {
        event: 'refresh_asana_access_token.failed',
        asana_organization: getAsanaOrganizationLogData(asanaAppUser),
        error: errorMessage,
      })

      await dbClient
        .deleteFrom('asana.app_user')
        .where('id', '=', asanaAppUser.id)
        .execute()
    }
  }
}

import { dbClient } from '@/database/client'
import { logger } from '@/lib/log/logger'

export async function deleteGithubInstallation(installationId: number) {
  try {
    // Delete the installation
    await dbClient
      .deleteFrom('github.installation')
      .where('ext_installation_id', '=', installationId)
      .execute()

    // Delete associated repositories
    await dbClient
      .deleteFrom('github.repo')
      .where('installation_id', '=', installationId)
      .execute()

    // Delete associated organizations
    await dbClient
      .deleteFrom('github.organization')
      .where('ext_gh_install_id', '=', installationId)
      .execute()

    logger.info('GitHub installation and associated data deleted', {
      installation_id: installationId,
    })
  } catch (error) {
    logger.error('Failed to delete GitHub installation', {
      installation_id: installationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}

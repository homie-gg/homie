import { dbClient } from '@/database/client'
import { dispatch } from '@/queue/dispatch'

export async function handleMigrateOrganizationsToNamespace() {
  const organizations = await dbClient
    .selectFrom('homie.organization')
    .select(['id'])
    .execute()

  await Promise.all(
    organizations.map(async (organization) => {
      await dispatch('migrate_organization_embeddings', {
        organization,
      })
    }),
  )
}

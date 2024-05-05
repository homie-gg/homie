import { dbClient } from '@/database/client'
import { Organization } from '@/database/types'
import { auth } from '@clerk/nextjs'

export async function getUserOrganization(): Promise<Organization | null> {
  const { userId } = auth()

  if (!userId) {
    return null
  }

  const organization = await dbClient
    .selectFrom('homie.organization')
    .where('ext_clerk_user_id', '=', userId)
    .selectAll()
    .executeTakeFirst()

  if (!organization) {
    return null
  }

  return organization
}

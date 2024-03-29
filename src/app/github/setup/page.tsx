import { dbClient } from '@/lib/db/client'
import { PageProps } from '@/lib/next-js/page-props'
import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

export default async function GithubSetup(
  props: PageProps<
    {},
    {
      installation_id: string
      setup_action: 'install'
      state: string
    }
  >,
) {
  const {
    searchParams: { installation_id, state: organization_id },
  } = props

  const { userId } = auth()

  if (!userId) {
    redirect('/')
  }

  const installId = parseInt(installation_id)

  const organization = await dbClient
    .selectFrom('voidpm.organization')
    .where('voidpm.organization.id', '=', parseInt(organization_id))
    .where('ext_clerk_user_id', '=', userId)
    .select('id')
    .executeTakeFirst()

  if (!organization) {
    return redirect('/')
  }

  dbClient
    .insertInto('github.organization')
    .values({
      ext_gh_install_id: installId,
      organization_id: organization.id,
    })
    .onConflict((oc) =>
      oc.column('organization_id').doUpdateSet({
        ext_gh_install_id: installId,
      }),
    )
    .executeTakeFirstOrThrow()

  return redirect('/review')
}

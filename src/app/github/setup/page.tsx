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
    }
  >,
) {
  const { searchParams } = props

  const { userId } = auth()

  if (!userId) {
    redirect('/')
  }

  const installId = parseInt(searchParams.installation_id)

  dbClient
    .insertInto('voidpm.organization')
    .values({
      ext_gh_install_id: installId,
      ext_clerk_user_id: userId,
    })
    .onConflict((oc) =>
      oc.column('ext_clerk_user_id').doUpdateSet({
        ext_gh_install_id: installId,
      }),
    )
    .executeTakeFirstOrThrow()

  return redirect('/review')
}

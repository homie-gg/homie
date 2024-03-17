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
  const {
    searchParams: { installation_id },
  } = props

  const { userId } = auth()

  if (!userId) {
    redirect('/')
  }

  dbClient
    .insertInto('pami.organization')
    .values({
      ext_gh_install_id: installation_id,
      ext_clerk_user_id: userId,
    })
    .onConflict((oc) =>
      oc.column('ext_clerk_user_id').doUpdateSet({
        ext_gh_install_id: installation_id,
      }),
    )
    .executeTakeFirstOrThrow()

  return redirect('/dashboard')
}

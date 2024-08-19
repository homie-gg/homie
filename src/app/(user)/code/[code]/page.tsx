import { config } from '@/config'
import { dbClient } from '@/database/client'
import { getUserOrganization } from '@/lib/auth/get-user-organization'
import { mailchimp } from '@/lib/mailchimp'
import { addYears, isBefore, subDays } from 'date-fns'
import { redirect } from 'next/navigation'

interface CodePageProps {
  params: {
    code: string
  }
}

export default async function CodePage(props: CodePageProps) {
  const {
    params: { code },
  } = props

  if (!code) {
    redirect('/')
    return
  }

  if (code !== 'oneyeartrial') {
    redirect('/')
    return
  }

  const organization = await getUserOrganization()
  if (!organization) {
    redirect('/')
    return
  }

  const organizationIsOld = isBefore(
    organization.created_at,
    subDays(new Date(), 1), // 1 dday lod
  )
  if (organizationIsOld) {
    redirect('/')
    return
  }

  if (organization.trial_ends_at) {
    redirect('/')
    return
  }

  await dbClient
    .updateTable('homie.organization')
    .set({
      trial_ends_at: addYears(new Date(), 1), // one year later
    })
    .where('id', '=', organization.id)
    .executeTakeFirstOrThrow()

  if (config.app.isProduction && organization.mailchimp_subscriber_hash) {
    await mailchimp.markBeganOneYearTrial({
      subscriberHash: organization.mailchimp_subscriber_hash,
    })
  }

  return redirect('/')
}

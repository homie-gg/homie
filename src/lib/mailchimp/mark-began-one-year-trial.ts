import { getMailchimp } from '@/lib/mailchimp/get-mailchimp'
import { tags } from '@/lib/mailchimp/tags'

interface MarkBeganOneYearTrial {
  subscriberHash: string
}

export async function markBeganOneYearTrial(params: MarkBeganOneYearTrial) {
  const { subscriberHash } = params

  const response = await getMailchimp().lists.updateListMemberTags(
    process.env.MAILCHIMP_LIST_ID!,
    subscriberHash,
    {
      tags: [
        {
          name: tags.oneYearTrial,
          status: 'active',
        },
      ],
    },
  )

  // success
  if (!response) {
    return
  }

  if ('status' in response) {
    throw new Error(`Failed to add Mailchimp tag: ${response.type}`)
  }
}

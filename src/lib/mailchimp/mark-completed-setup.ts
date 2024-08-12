import { getMailchimp } from '@/lib/mailchimp/get-mailchimp'
import { tags } from '@/lib/mailchimp/tags'

interface MarkCompletedSetupParams {
  subscriberHash: string
}

export async function markCompletedSetup(params: MarkCompletedSetupParams) {
  const { subscriberHash } = params

  const response = await getMailchimp().lists.updateListMemberTags(
    process.env.MAILCHIMP_LIST_ID!,
    subscriberHash,
    {
      tags: [
        {
          name: tags.signedUp,
          status: 'active',
        },
        {
          name: tags.completedSetup,
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
    throw new Error(
      `Failed to add Mailchimp tag "CompletedSetup": ${response.type}`,
    )
  }
}

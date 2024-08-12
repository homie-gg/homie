import { mailchimpClient } from '@/lib/mailchimp/client'
import { tags } from '@/lib/mailchimp/tags'

interface SubscribeMailchimpUserParams {
  email: string
}

export async function subscribeUser(params: SubscribeMailchimpUserParams) {
  const { email } = params

  const response = await mailchimpClient.lists.addListMember(
    process.env.MAILCHIMP_LIST_ID!,
    {
      status: 'subscribed',
      email_address: email,
      tags: [tags.signedUp],
    },
  )

  // Success
  if ('contact_id' in response) {
    return response.id
  }

  throw new Error('Failed to create Mailchimp contact.')
}

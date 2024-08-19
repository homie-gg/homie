import { getMailchimp } from '@/lib/mailchimp/get-mailchimp'
import { getMailchimpErrorResponse } from '@/lib/mailchimp/get-mailchimp-error-response'
import { tags } from '@/lib/mailchimp/tags'
import crypto from 'crypto'

interface SubscribeMailchimpUserParams {
  email: string
}

export async function subscribeUser(params: SubscribeMailchimpUserParams) {
  const { email } = params

  try {
    const response = await getMailchimp().lists.addListMember(
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
  } catch (error: unknown) {
    const errorResponse = getMailchimpErrorResponse(error)
    if (!errorResponse) {
      throw error
    }

    if (errorResponse.title === 'Member Exists') {
      // Return subscriber hash manually
      return crypto.createHash('md5').update(email.toLowerCase()).digest('hex')
    }

    throw error
  }
}

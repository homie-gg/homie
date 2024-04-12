import {
  NotFoundException,
  UnauthorizedException,
} from '@/lib/http/server/exceptions'
import { auth, clerkClient } from '@clerk/nextjs'

export async function getUserEmail() {
  const { userId } = auth()
  if (!userId) {
    throw new UnauthorizedException()
  }

  const user = await clerkClient.users.getUser(userId)

  const primaryEmail = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId,
  )

  if (!primaryEmail) {
    throw new NotFoundException({
      message: 'Missing user email',
      type: 'missing_user_email',
    })
  }

  return primaryEmail.emailAddress
}

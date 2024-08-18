import { markBeganOneYearTrial } from '@/lib/mailchimp/mark-began-one-year-trial'
import { markCompletedSetup } from '@/lib/mailchimp/mark-completed-setup'
import { subscribeUser } from '@/lib/mailchimp/subscribe-user'

export const mailchimp = {
  subscribeUser,
  markCompletedSetup,
  markBeganOneYearTrial,
}

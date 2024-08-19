import { ErrorResponse } from '@mailchimp/mailchimp_marketing'

export function getMailchimpErrorResponse(error: any): ErrorResponse | null {
  try {
    return JSON.parse(error.response.res.text)
  } catch {
    return null
  }
}

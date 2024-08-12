import mailchimp from '@mailchimp/mailchimp_marketing'

let client: typeof mailchimp | null = null

export const getMailchimp = (): typeof mailchimp => {
  if (client) {
    return client
  }

  mailchimp.setConfig({
    apiKey: process.env.MAILCHIMP_API_KEY,
    server: process.env.MAILCHIMP_SERVER_PREFIX,
  })

  client = mailchimp

  return client
}

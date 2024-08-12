import mailchimpClient from '@mailchimp/mailchimp_marketing'

mailchimpClient.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX,
})

export { mailchimpClient }

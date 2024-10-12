import { NextApiRequest, NextApiResponse } from 'next'
import { getGithubWebhooks } from '@/lib/github/create-github-webhooks'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const webhooks = getGithubWebhooks()
  
  try {
    await webhooks.verifyAndReceive({
      id: req.headers['x-github-delivery'] as string,
      name: req.headers['x-github-event'] as string,
      payload: req.body,
      signature: req.headers['x-hub-signature-256'] as string,
    })

    res.status(200).json({ message: 'Webhook processed successfully' })
  } catch (error) {
    console.error('Error processing webhook:', error)
    res.status(500).json({ message: 'Error processing webhook' })
  }
}

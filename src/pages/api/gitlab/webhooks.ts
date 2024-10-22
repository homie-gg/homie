import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { dispatch } from '@/queue/dispatch'
import {
  generateSummary,
  createOrUpdateGitlabComment,
} from '@/lib/pullRequests/generateSummary'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'POST') {
    const { object_kind, project, object_attributes } = req.body

    if (object_kind === 'merge_request') {
      const organization = await prisma.organization.findFirst({
        where: {
          gitlab_group_id: project.namespace_id,
        },
      })

      if (!organization) {
        console.error('Organization not found')
        return res.status(404).json({ error: 'Organization not found' })
      }

      if (object_attributes.action === 'open') {
        // Generate summary
        const summary = await generateSummary({
          title: object_attributes.title,
          body: object_attributes.description || '',
          diffUrl: object_attributes.url,
          organizationId: organization.id,
        })

        // Create or update comment with summary
        await createOrUpdateGitlabComment(
          organization.gitlab_access_token,
          project.id,
          object_attributes.iid,
          summary,
        )

        await dispatch('gitlab:analyze-merge-request', {
          organizationId: organization.id,
          mergeRequestId: object_attributes.id,
          projectId: project.id,
          iid: object_attributes.iid,
        })
      }

      res.status(200).json({ message: 'Webhook received' })
    } else {
      res.status(400).json({ error: 'Unsupported event type' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}

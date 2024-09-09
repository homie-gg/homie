import { createJob } from '@/queue/create-job'
import { dbClient } from '@/database/client'
import { closeLinkedTrelloTasks } from '@/lib/trello/close-linked-trello-tasks'
import { closeLinkedAsanaTasks } from '@/lib/asana/close-linked-asana-tasks'
import { getSlackLinks } from '@/lib/slack/get-slack-links'
import { sendSlackPRMergedMessage } from '@/lib/slack/send-slack-pr-merged-message'

export const closeLinkedTasks = createJob({
  id: 'close_linked_tasks',
  handle: async (payload: {
    pull_request: {
      title: string
      body: string
      html_url: string
    }
    organization: {
      id: number
    }
  }) => {
    const { pull_request, organization } = payload

    const organizationWithBilling = await dbClient
      .selectFrom('homie.organization')
      .leftJoin(
        'slack.workspace',
        'slack.workspace.organization_id',
        'homie.organization.id',
      )
      .leftJoin(
        'homie.subscription',
        'homie.subscription.organization_id',
        'homie.organization.id',
      )
      .leftJoin('homie.plan', 'homie.plan.id', 'homie.subscription.plan_id')
      .leftJoin(
        'trello.workspace',
        'trello.workspace.organization_id',
        'homie.organization.id',
      )
      .where('homie.organization.id', '=', organization.id)
      .select([
        'homie.organization.id',
        'has_unlimited_usage',
        'slack_access_token',
      ])
      .executeTakeFirst()

    if (!organizationWithBilling) {
      return
    }

    if (!pull_request.body) {
      return
    }

    const trelloWorkspace = await dbClient
      .selectFrom('trello.workspace')
      .where('organization_id', '=', organizationWithBilling.id)
      .select(['ext_trello_done_task_list_id', 'trello_access_token'])
      .executeTakeFirst()

    if (trelloWorkspace) {
      await closeLinkedTrelloTasks({
        pullRequestBody: pull_request.body,
        trelloWorkspace,
      })
    }

    const asanaAppUser = await dbClient
      .selectFrom('asana.app_user')
      .where('organization_id', '=', organizationWithBilling.id)
      .select(['asana_access_token'])
      .executeTakeFirst()

    if (asanaAppUser) {
      await closeLinkedAsanaTasks({
        pullRequestBody: pull_request.body,
        asanaAppUser,
      })
    }

    const slackAccessToken = organizationWithBilling.slack_access_token

    if (!slackAccessToken) {
      return
    }

    const slackLinks = getSlackLinks({ pullRequestBody: pull_request.body })

    await Promise.all(
      slackLinks.map((slackLink) =>
        sendSlackPRMergedMessage({
          slackLink,
          pullRequest: {
            title: pull_request.title,
            htmlUrl: pull_request.html_url,
          },
          organization: {
            slack_access_token: slackAccessToken,
          },
        }),
      ),
    )
  },
})

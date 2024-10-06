import { dbClient } from '@/database/client'
import { createAsanaClient } from '@/lib/asana/create-asana-client'
import { createGithubClient } from '@/lib/github/create-github-client'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { createSlackClient } from '@/lib/slack/create-slack-client'
import { getMessageLink } from '@/lib/slack/get-message-link'
import { sendTaskCreatedMessage } from '@/lib/slack/send-task-created-message'
import { createTrelloClient } from '@/lib/trello/create-trello-client'
import { TrelloCard } from '@/lib/trello/types'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { marked } from 'marked'

interface GetCreateTaskToolParams {
  organization: {
    id: number
    slack_access_token: string
    ext_gh_install_id: number | null
    trello_access_token: string | null
    asana_access_token: string | null
    ext_trello_new_task_list_id: string | null
  }
  answerId: string
  channelID: string
  targetMessageTS: string
}

export function getCreateTaskTool(params: GetCreateTaskToolParams) {
  const { organization, answerId, channelID, targetMessageTS } = params

  return new DynamicStructuredTool({
    name: 'create_task',
    description:
      'Creates a task to track an issue or feature but NOT actually implement the fix.',
    schema: z.object({
      title: z
        .string()
        .describe('Main requirement of the task in one sentence.'),
      originalMessage: z
        .string()
        .describe('The original message that describes the task.'),
      requirements: z
        .string()
        .describe('A summary of the task requirmeents in a bulleted list.'),
      app: z
        .enum(['github', 'asana', 'trello'])
        .describe('The name of the app to create a task for'),
      asanaProjectID: z
        .number()
        .optional()
        .describe('Asana project ID to create the task in'),
      githubRepoID: z
        .number()
        .optional()
        .describe('Github Repository ID to create the issue in'),
    }),
    func: async (data) => {
      const {
        app,
        requirements,
        originalMessage,
        title,
        asanaProjectID,
        githubRepoID,
      } = data

      logger.debug('Call - create task', {
        event: 'get_answer:create_task:call',
        answer_id: answerId,
        organization: getOrganizationLogData(organization),
        channel_id: channelID,
        app,
        asanaProjectID,
        githubRepoID,
        requirements,
        title,
        originalMessage,
      })

      try {
        const slackClient = createSlackClient(organization.slack_access_token)

        const slackMessageUrl = await getMessageLink({
          channelID,
          messageTS: targetMessageTS,
          slackClient,
        })

        const description = `**Slack Message:**\n\n[${originalMessage}](${slackMessageUrl})\n\n**Requirements:**\n\n${requirements}`

        logger.debug('Got task description', {
          event: 'get_answer:create_task:task_description',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          channel_id: channelID,
          app,
          asanaProjectID,
          githubRepoID,
          requirements,
          title,
          originalMessage,
          description,
        })

        if (
          app === 'trello' &&
          organization.trello_access_token &&
          organization.ext_trello_new_task_list_id
        ) {
          const trelloClient = createTrelloClient(
            organization.trello_access_token,
          )

          const card = await trelloClient.post<TrelloCard>(`/cards`, {
            idList: organization.ext_trello_new_task_list_id,
            name: title,
            desc: description,
          })

          await sendTaskCreatedMessage({
            slackClient,
            channelID,
            threadTS: targetMessageTS,
            message: 'Trello task created:',
            title,
            description,
            url: card.shortUrl,
          })

          logger.debug('Trello task created', {
            event: 'get_answer:create_task:trello_task_created',
            answer_id: answerId,
            organization: getOrganizationLogData(organization),
            channel_id: channelID,
            app,
            asanaProjectID,
            githubRepoID,
            requirements,
            title,
            originalMessage,
            description,
            url: card.shortUrl,
          })

          return 'Success!'
        }

        if (app === 'trello') {
          logger.debug('Trello not set up', {
            event: 'get_answer:create_task:trello_not_setup',
            answer_id: answerId,
            organization: getOrganizationLogData(organization),
            channel_id: channelID,
            app,
            asanaProjectID,
            githubRepoID,
            requirements,
            title,
            originalMessage,
            description,
          })
          return 'Failed. Trello integration has not been set up. Go into Settings > Trello to get started.'
        }

        if (
          app === 'github' &&
          organization.ext_gh_install_id &&
          githubRepoID
        ) {
          const github = await createGithubClient({
            installationId: organization.ext_gh_install_id,
          })

          const githubRepo = await dbClient
            .selectFrom('github.repo')
            .where('organization_id', '=', organization.id)
            .where('github.repo.id', '=', githubRepoID)
            .select(['owner', 'name'])
            .executeTakeFirst()

          if (!githubRepo) {
            logger.debug('Missing github repo', {
              event: 'get_answer:create_task:missing_github_repo',
              answer_id: answerId,
              organization: getOrganizationLogData(organization),
              channel_id: channelID,
              app,
              asanaProjectID,
              githubRepoID,
              requirements,
              title,
              originalMessage,
            })

            return `Failed. Could not find repo with ID: ${githubRepoID}`
          }

          const githubIssue = await github.rest.issues.create({
            owner: githubRepo.owner!,
            repo: githubRepo.name,
            title,
            body: description,
          })

          await sendTaskCreatedMessage({
            slackClient,
            channelID,
            threadTS: targetMessageTS,
            message: 'GitHub issue created:',
            title,
            description,
            url: githubIssue.data?.html_url ?? '#',
          })

          logger.debug('Created GitHub issue', {
            event: 'get_answer:create_task:created_github_issue',
            answer_id: answerId,
            organization: getOrganizationLogData(organization),
            channel_id: channelID,
            app,
            asanaProjectID,
            githubRepoID,
            requirements,
            title,
            originalMessage,
            url: githubIssue.data?.html_url ?? '#',
          })

          return 'Success!'
        }

        if (app === 'github' && !githubRepoID) {
          logger.debug('Missing github repo id', {
            event: 'get_answer:create_task:missing_github_repo_id',
            answer_id: answerId,
            organization: getOrganizationLogData(organization),
            channel_id: channelID,
            app,
            asanaProjectID,
            githubRepoID,
            requirements,
            title,
            originalMessage,
          })

          return 'Failed. Github repository ID is missing. Try listing Github repositories to find one.'
        }

        if (app === 'github') {
          logger.debug('GitHub not setup properly', {
            event: 'get_answer:create_task:github_not_setup',
            answer_id: answerId,
            organization: getOrganizationLogData(organization),
            channel_id: channelID,
            app,
            asanaProjectID,
            githubRepoID,
            requirements,
            title,
            originalMessage,
          })

          return 'Failed. GitHub integration has not been set up properly.'
        }

        if (
          app === 'asana' &&
          organization.asana_access_token &&
          asanaProjectID
        ) {
          const project = await dbClient
            .selectFrom('asana.project')
            .where('id', '=', asanaProjectID)
            .where('organization_id', '=', organization.id)
            .where('enabled', '=', true)
            .select(['ext_asana_project_id'])
            .executeTakeFirst()

          if (!project) {
            return `Failed. Missing Asana project with id: ${asanaProjectID}`
          }

          const asana = createAsanaClient(organization.asana_access_token)

          const { data: task } = await asana.post<any>('/tasks', {
            data: {
              name: title,
              resource_subtype: 'default_task',
              projects: [project.ext_asana_project_id],
              html_notes: `<body>${marked.parse(description)}</body>`
                .replaceAll('<p>', '')
                .replaceAll('</p>', ''),
            },
          })

          await sendTaskCreatedMessage({
            slackClient,
            channelID,
            threadTS: targetMessageTS,
            message: 'Asana task created:',
            title,
            description,
            url: task.permalink_url,
          })

          logger.debug('Created Asana task', {
            event: 'get_answer:create_task:created_asana_task',
            answer_id: answerId,
            organization: getOrganizationLogData(organization),
            channel_id: channelID,
            app,
            asanaProjectID,
            githubRepoID,
            requirements,
            title,
            originalMessage,
            url: task.permalink_url,
          })

          return 'Success!'
        }

        if (app === 'asana' && !asanaProjectID) {
          logger.debug('Missing asana project id', {
            event: 'get_answer:create_task:missing_asana_project_id',
            answer_id: answerId,
            organization: getOrganizationLogData(organization),
            channel_id: channelID,
            app,
            asanaProjectID,
            githubRepoID,
            requirements,
            title,
            originalMessage,
          })

          return `Failed. Asana project ID is missing. Try listing Asana projects to pick one to create task: ${JSON.stringify(
            {
              title,
              requirements,
              originalMessage,
              description,
            },
          )}`
        }

        if (app === 'asana') {
          return 'Failed. Asana has not been set up properly.'
        }

        return `Failed. unhandled app: ${app}`
      } catch (error) {
        return 'FAILED'
      }
    },
  })
}

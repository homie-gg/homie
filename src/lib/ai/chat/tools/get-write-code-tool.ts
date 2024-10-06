import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { writeCode } from '@/queue/jobs/write-code'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

interface GetWriteCodeToolParams {
  organization: {
    id: number
    ext_gh_install_id: number | null
    gitlab_access_token: string | null
    slack_access_token: string
  }
  answerID: string
  slackChannelID: string
  slackTargetMessageTS: string
}

const processingMessage = 'Starting to write code. Will open a PR in a minute.'

export function getWriteCodeTool(params: GetWriteCodeToolParams) {
  const { organization, answerID, slackTargetMessageTS, slackChannelID } =
    params
  return new DynamicStructuredTool({
    name: 'write_code',
    description:
      'Fix an issue, implement a feature, open a Pull Request by writing the code.',
    schema: z.object({
      requirements: z
        .string()
        .describe(
          'Requirements that describe the bug fix or feature that the code should do.',
        ),
      github_repo_id: z
        .number()
        .optional()
        .describe('ID of the GitHub repository to push changes to.'),
      gitlab_project_id: z
        .number()
        .optional()
        .describe('ID of the Gitalb project to push changes to.'),
    }),
    func: async (params) => {
      const {
        requirements: instructions,
        github_repo_id,
        gitlab_project_id,
      } = params

      if (!github_repo_id && !gitlab_project_id) {
        logger.debug(
          'GitHub Repo ID and Gitlab project ID were not specified.',
          {
            event: 'write_code:missing_repo_id',
            answer_id: answerID,
            organization: getOrganizationLogData(organization),
          },
        )

        return `At least one 'github_repo_id' or 'gitlab_project_id' must be specified. You may call 'list_github_repos' and 'list_gitlab_projects' tools to get a list of available repos and projects.`
      }

      if (github_repo_id && gitlab_project_id) {
        logger.debug(
          'Both GitHub Repo ID and Gitlab project ID were specified.',
          {
            event: 'write_code:too_many_repo_id',
            answer_id: answerID,
            organization: getOrganizationLogData(organization),
          },
        )

        return `Only one 'github_repo_id' or 'gitlab_project_id' should be specified. Which should be used?`
      }

      if (github_repo_id && organization.ext_gh_install_id) {
        await writeCode.dispatch(
          {
            organization,
            instructions,
            github_repo_id,
            slack_target_message_ts: slackTargetMessageTS,
            slack_channel_id: slackChannelID,
            answer_id: answerID,
          },
          {
            attempts: 1,
          },
        )

        return processingMessage
      }

      if (gitlab_project_id) {
        await writeCode.dispatch({
          organization,
          instructions,
          gitlab_project_id,
          slack_target_message_ts: slackTargetMessageTS,
          slack_channel_id: slackChannelID,
          answer_id: answerID,
        })

        return processingMessage
      }

      logger.debug('Missing params', {
        event: 'write_code:missing params',
        answer_id: answerID,
        organization: getOrganizationLogData(organization),
      })

      return 'Failed to write code; missing params.'
    },
  })
}

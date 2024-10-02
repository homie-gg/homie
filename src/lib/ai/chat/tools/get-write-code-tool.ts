import { writeCode } from '@/queue/jobs/write-code'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

interface GetWriteCodeToolParams {
  organization: {
    id: number
  }
  answerId: string
}

const processingMessage = 'Starting to write code. Will open a PR in a minute.'

export function getWriteCodeTool(params: GetWriteCodeToolParams) {
  const { organization, answerId } = params
  return new DynamicStructuredTool({
    name: 'write_code',
    description:
      'Write some code to a given GitHub Repository or Gitlab Project.',
    schema: z.object({
      instructions: z.string().describe('What the code should do.'),
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
      const { instructions, github_repo_id, gitlab_project_id } = params

      if (github_repo_id) {
        writeCode.dispatch({
          organization_id: organization.id,
          github_repo_id,
          instructions,
        })

        return processingMessage
      }

      if (gitlab_project_id) {
        writeCode.dispatch({
          organization_id: organization.id,
          gitlab_project_id,
          instructions,
        })

        return processingMessage
      }

      return 'At least one, a GitHub repository ID or Gitlab project ID must be specified.'
    },
  })
}

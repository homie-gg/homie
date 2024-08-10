import { rephraseWithPersona } from '@/lib/ai/rephrase-with-persona'
import { getListPullRequestsTool } from '@/lib/ai/chat/tools/get-list-pull-requests-tool'
import { getRememberConversationTool } from '@/lib/ai/chat/tools/get-remember-conversation-tool'
import { Message } from '@/lib/ai/chat/types'
import { getFindCompletedTasksTool } from '@/lib/ai/chat/tools/get-find-completed-tasks-tool'
import { getFindWhatContributorIsWorkingOnTool } from '@/lib/ai/chat/tools/get-find-what-contributor-is-working-on-tool'
import { getAssignTaskToContributorTool } from '@/lib/ai/chat/tools/get-assign-task-to-contributor-tool'
import { getMarkTaskAsDoneTool } from '@/lib/ai/chat/tools/get-mark-task-as-done-tool'
import { getFindTaskTool } from '@/lib/ai/chat/tools/get-find-task-tool'
import { v4 as uuid } from 'uuid'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { getFetchPullRequestDetailTool } from '@/lib/ai/chat/tools/get-fetch-pull-request-detail-tool'
import { getListCommitsDeployedToBranchTool } from '@/lib/ai/chat/tools/get-list-commits-deployed-to-branch-tool'
import { getSearchForTasksTool } from '@/lib/ai/chat/tools/get-search-for-tasks-tool'
import { getCreateTaskTool } from '@/lib/ai/chat/tools/get-create-task-tool'
import { getListGithubReposTool } from '@/lib/ai/chat/tools/get-list-github-repos-tool'
import { getListAsanaProjectsTool } from '@/lib/ai/chat/tools/get-list-asana-projects-tool'
import { getSearchPullRequestsTool } from '@/lib/ai/chat/tools/get-search-pull-requests-tool'
import { getSearchGeneralContextTool } from '@/lib/ai/chat/tools/get-search-general-context-tool'
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs'
import { createOpenAIClient } from '@/lib/open-ai/create-open-ai-client'

interface GetAnswerParams {
  organization: {
    id: number
    is_persona_enabled: boolean
    persona_positivity_level: number
    persona_g_level: number
    persona_affection_level: number
    persona_emoji_level: number
    slack_access_token: string
    ext_gh_install_id: number | null
    trello_access_token: string | null
    asana_access_token: string | null
    ext_trello_new_task_list_id: string | null
    ext_trello_done_task_list_id: string | null
  }
  messages: Message[]
  channelID: string
}

export async function getAnswer(params: GetAnswerParams): Promise<string> {
  const { organization, messages, channelID } = params

  const currentMessage = messages.pop()

  if (!currentMessage) {
    return 'Message was provided.'
  }

  const answerId = uuid()

  logger.debug('Get Answer - Start', {
    event: 'get_answer:start',
    answer_id: answerId,
    organization: getOrganizationLogData(organization),
  })

  let toolAnswer: string | null = null

  const thread: ChatCompletionMessageParam[] = messages.map((message) => {
    switch (message.type) {
      case 'bot':
        return {
          role: 'system',
          content: message.text,
        }
      case 'human':
        return {
          role: 'user',
          content: message.text,
        }
    }
  })

  const currentDate = new Date().toISOString()

  const openAI = createOpenAIClient()
  const completion = openAI.beta.chat.completions.runTools({
    model: 'gpt-4o-2024-08-06',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful project manager for a software company.',
      },
      {
        role: 'system',
        content: `The current date is ${currentDate}`,
      },
      ...thread,
    ],
    tools: [
      getSearchGeneralContextTool({
        organization,
        answerId,
      }),
      getListPullRequestsTool({
        organization,
        answerId,
      }),
      getRememberConversationTool({
        targetMessageTS: currentMessage.ts,
        organization,
        messages,
        channelID: channelID,
        answerId,
      }),
      getFindCompletedTasksTool({
        organization,
        answerId,
      }),
      getFindWhatContributorIsWorkingOnTool({
        organization,
        answerId,
      }),
      getAssignTaskToContributorTool({
        organization,
        answerId,
      }),
      getMarkTaskAsDoneTool({
        organization,
        answerId,
      }),
      getFindTaskTool({
        organization,
        answerId,
      }),
      getFetchPullRequestDetailTool({
        organization,
        answerId,
      }),
      getListCommitsDeployedToBranchTool({
        organization,
        answerId,
        onAnswer: (result) => {
          toolAnswer = result
        },
      }),
      getSearchForTasksTool({
        organization,
        answerId,
      }),
      getCreateTaskTool({
        organization,
        answerId,
        targetMessageTS: currentMessage.ts,
        channelID,
      }),
      getListGithubReposTool({
        organization,
        answerId,
      }),
      getListAsanaProjectsTool({
        organization,
        answerId,
      }),
      getSearchPullRequestsTool({
        organization,
        answerId,
      }),
    ],
  })

  const result = (await completion.finalChatCompletion()).choices[0].message
    .content

  // If a tool outputs an exact answer, use that instead of the LLM output.
  const answer = toolAnswer ?? result ?? 'No answer found'

  logger.debug('Get Answer - Result', {
    event: 'get_answer:result',
    answer_id: answerId,
    organization: getOrganizationLogData(organization),
    input: currentMessage.text,
    is_tool_answer: Boolean(toolAnswer),
    answer,
  })

  if (organization.is_persona_enabled) {
    return rephraseWithPersona({
      affectionLevel: organization.persona_affection_level,
      gLevel: organization.persona_g_level,
      emojiLevel: organization.persona_emoji_level,
      positivityLevel: organization.persona_positivity_level,
      text: answer,
    })
  }

  return answer
}

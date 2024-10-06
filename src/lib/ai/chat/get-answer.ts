import { RunnableSequence } from '@langchain/core/runnables'
import { AgentExecutor } from 'langchain/agents'
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts'
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages'
import { formatToOpenAIFunctionMessages } from 'langchain/agents/format_scratchpad'
import { OpenAIFunctionsAgentOutputParser } from 'langchain/agents/openai/output_parser'

import { createOpenAIChatClient } from '@/lib/open-ai/create-open-ai-chat-client'
import { convertToOpenAIFunction } from '@langchain/core/utils/function_calling'
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
import { getTodaysDateTool } from '@/lib/ai/chat/tools/get-todays-date-tool'
import { getFetchPullRequestDetailTool } from '@/lib/ai/chat/tools/get-fetch-pull-request-detail-tool'
import { getListCommitsDeployedToBranchTool } from '@/lib/ai/chat/tools/get-list-commits-deployed-to-branch-tool'
import { getSearchForTasksTool } from '@/lib/ai/chat/tools/get-search-for-tasks-tool'
import { getCreateTaskTool } from '@/lib/ai/chat/tools/get-create-task-tool'
import { getListGithubReposTool } from '@/lib/ai/chat/tools/get-list-github-repos-tool'
import { getListAsanaProjectsTool } from '@/lib/ai/chat/tools/get-list-asana-projects-tool'
import { getSearchPullRequestsTool } from '@/lib/ai/chat/tools/get-search-pull-requests-tool'
import { getSearchGeneralContextTool } from '@/lib/ai/chat/tools/get-search-general-context-tool'
import { getFindContributorTool } from '@/lib/ai/chat/tools/get-find-contributor-tool'
import { getWriteCodeTool } from '@/lib/ai/chat/tools/get-write-code-tool'
import { getListGitlabProjectsTool } from '@/lib/ai/chat/tools/get-list-gitlab-projects-tool'

interface GetAnswerParams {
  organization: {
    id: number
    is_persona_enabled: boolean
    persona_positivity_level: number
    persona_g_level: number
    persona_affection_level: number
    persona_emoji_level: number
    slack_access_token?: string
    ext_gh_install_id: number | null
    gitlab_access_token?: string | null
    trello_access_token?: string | null
    asana_access_token?: string | null
    ext_trello_new_task_list_id?: string | null
    ext_trello_done_task_list_id?: string | null
  }
  messages: Message[]
  channelID: string
}

export async function getAnswer(params: GetAnswerParams): Promise<string> {
  const { organization, messages, channelID } = params

  const currentMessage = messages.pop()

  if (!currentMessage) {
    return 'No message was provided.'
  }

  const answerID = uuid()

  logger.debug('Get Answer - Start', {
    event: 'get_answer:start',
    answer_id: answerID,
    organization: getOrganizationLogData(organization),
  })

  let toolAnswer: string | null = null

  const isGitHubContext = channelID.startsWith('github-')

  const tools = [
    getSearchGeneralContextTool({
      organization,
      answerID,
    }),
    getListPullRequestsTool({
      organization,
      answerID,
    }),
    getRememberConversationTool({
      targetMessageTS: currentMessage.ts,
      organization,
      messages,
      channelID: channelID,
      answerID,
    }),
    isGitHubContext
      ? getGitHubPullRequestContextTool({
          organization,
          answerID,
          channelID,
        })
      : null,
    getTodaysDateTool({ answerId: answerID, organization }),
    getFindCompletedTasksTool({
      organization,
      answerID,
    }),
    getFindWhatContributorIsWorkingOnTool({
      organization,
      answerID,
    }),
    getAssignTaskToContributorTool({
      organization,
      answerID,
    }),
    getMarkTaskAsDoneTool({
      organization,
      answerID,
    }),
    getFindTaskTool({
      organization,
      answerID,
    }),
    getFetchPullRequestDetailTool({
      organization,
      answerID,
    }),
    getListCommitsDeployedToBranchTool({
      organization,
      answerID,
      onAnswer: (result) => {
        toolAnswer = result
      },
    }),
    getSearchForTasksTool({
      organization,
      answerID,
    }),
    getCreateTaskTool({
      organization,
      answerId: answerID,
      targetMessageTS: currentMessage.ts,
      channelID,
    }),
    getListGithubReposTool({
      organization,
      answerID,
    }),
    getListGitlabProjectsTool({
      organization,
      answerID,
    }),
    getListAsanaProjectsTool({
      organization,
      answerID,
    }),
    getSearchPullRequestsTool({
      organization,
      answerID,
    }),
    getFindContributorTool({
      organization,
      answerID,
    }),
    getWriteCodeTool({
      slackTargetMessageTS: currentMessage.ts,
      organization,
      answerID: answerID,
      slackChannelID: channelID,
    }),
  ]

  const model = createOpenAIChatClient({ model: 'gpt-4o-2024-05-13' })
  const modelWithFunctions = model.bind({
    functions: tools.map((tool) => convertToOpenAIFunction(tool)),
  })

  const chatHistory: BaseMessage[] = messages.map((message) => {
    switch (message.type) {
      case 'bot':
        return new SystemMessage({ content: message.text })
      case 'human':
        return new HumanMessage({
          content: message.text,
        })
    }
  })

  const currentDate = new Date().toISOString()

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'You are helpful project manager.'],
    [
      'system',
      'You MUST call a function or tool to get your answer. If one is not found call search_general_context',
    ],
    ['system', `The current date is ${currentDate}`],
    ['system', 'Always include URL links if available.'],
    new MessagesPlaceholder('chat_history'),
    ['user', '{input}'],
    new MessagesPlaceholder('agent_scratchpad'),
  ])

  const agent = RunnableSequence.from([
    {
      input: (i) => i.input,
      agent_scratchpad: (i) => formatToOpenAIFunctionMessages(i.steps),
      chat_history: (i) => i.chat_history,
    },
    prompt,
    modelWithFunctions,
    new OpenAIFunctionsAgentOutputParser(),
  ])

  const executor = AgentExecutor.fromAgentAndTools({
    agent,
    tools,
  })

  const result = await executor.invoke({
    input: currentMessage.text,
    chat_history: chatHistory,
  })

  // If a tool outputs an exact answer, use that instead of the LLM output.
  const answer = toolAnswer ?? result.output

  logger.debug('Get Answer - Result', {
    event: 'get_answer:result',
    answer_id: answerID,
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

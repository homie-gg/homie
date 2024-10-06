import { RunnableSequence } from '@langchain/core/runnables'
import { AgentExecutor } from 'langchain/agents'
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts'
import { formatToOpenAIFunctionMessages } from 'langchain/agents/format_scratchpad'
import { OpenAIFunctionsAgentOutputParser } from 'langchain/agents/openai/output_parser'
import { createOpenAIChatClient } from '@/lib/open-ai/create-open-ai-chat-client'
import { convertToOpenAIFunction } from '@langchain/core/utils/function_calling'
import { getListPullRequestsTool } from '@/lib/ai/chat/tools/get-list-pull-requests-tool'
import { getFindCompletedTasksTool } from '@/lib/ai/chat/tools/get-find-completed-tasks-tool'
import { getFindWhatContributorIsWorkingOnTool } from '@/lib/ai/chat/tools/get-find-what-contributor-is-working-on-tool'
import { getFindTaskTool } from '@/lib/ai/chat/tools/get-find-task-tool'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { getTodaysDateTool } from '@/lib/ai/chat/tools/get-todays-date-tool'
import { getFetchPullRequestDetailTool } from '@/lib/ai/chat/tools/get-fetch-pull-request-detail-tool'
import { getListCommitsDeployedToBranchTool } from '@/lib/ai/chat/tools/get-list-commits-deployed-to-branch-tool'
import { getSearchForTasksTool } from '@/lib/ai/chat/tools/get-search-for-tasks-tool'
import { getListGithubReposTool } from '@/lib/ai/chat/tools/get-list-github-repos-tool'
import { getListAsanaProjectsTool } from '@/lib/ai/chat/tools/get-list-asana-projects-tool'
import { getSearchPullRequestsTool } from '@/lib/ai/chat/tools/get-search-pull-requests-tool'
import { getSearchGeneralContextTool } from '@/lib/ai/chat/tools/get-search-general-context-tool'
import { getFindContributorTool } from '@/lib/ai/chat/tools/get-find-contributor-tool'
import { getListGitlabProjectsTool } from '@/lib/ai/chat/tools/get-list-gitlab-projects-tool'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

interface GetFindAnswerAgent {
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
  messageId: string
}

export function getFindAnswerAgent(params: GetFindAnswerAgent) {
  const { organization, messageId } = params

  return new DynamicStructuredTool({
    name: 'find_answer',
    description:
      'Finds an answer to a question. Including listing resources, or search.',
    schema: z.object({
      question: z.string().describe('The question that should be answered.'),
    }),
    func: async (params) => {
      const { question } = params

      logger.debug('Find answer', {
        event: 'find_answer:call',
        message_id: messageId,
        organization: getOrganizationLogData(organization),
        question,
      })

      let toolAnswer: string | null = null

      const tools = [
        getSearchGeneralContextTool({
          organization,
          answerId: messageId,
        }),
        getListPullRequestsTool({
          organization,
          answerId: messageId,
        }),
        getTodaysDateTool({ answerId: messageId, organization }),
        getFindCompletedTasksTool({
          organization,
          answerId: messageId,
        }),
        getFindWhatContributorIsWorkingOnTool({
          organization,
          answerId: messageId,
        }),
        getFindTaskTool({
          organization,
          answerId: messageId,
        }),
        getFetchPullRequestDetailTool({
          organization,
          answerId: messageId,
        }),
        getListCommitsDeployedToBranchTool({
          organization,
          answerId: messageId,
          onAnswer: (result) => {
            toolAnswer = result
          },
        }),
        getSearchForTasksTool({
          organization,
          answerId: messageId,
        }),
        getListGithubReposTool({
          organization,
          answerId: messageId,
        }),
        getListGitlabProjectsTool({
          organization,
          answerId: messageId,
        }),
        getListAsanaProjectsTool({
          organization,
          answerId: messageId,
        }),
        getSearchPullRequestsTool({
          organization,
          answerId: messageId,
        }),
        getFindContributorTool({
          organization,
          answerId: messageId,
        }),
      ]

      const model = createOpenAIChatClient({ model: 'gpt-4o-2024-05-13' })
      const modelWithFunctions = model.bind({
        functions: tools.map((tool) => convertToOpenAIFunction(tool)),
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
        input: question,
      })

      // If a tool outputs an exact answer, use that instead of the LLM output.
      const answer = toolAnswer ?? result.output

      logger.debug('Found answer', {
        event: 'find_answer:result',
        answer_id: messageId,
        organization: getOrganizationLogData(organization),
        question,
        is_tool_answer: Boolean(toolAnswer),
        answer,
      })

      return answer
    },
  })
}

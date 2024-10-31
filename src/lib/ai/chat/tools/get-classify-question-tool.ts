import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'

interface GetClassifyQuestionToolParams {
  organization: {
    id: number
  }
  answerID: string
}

export const QuestionType = {
  TASK_SEARCH: 'task_search',
  PR_SEARCH: 'pr_search',
  CODE_HELP: 'code_help',
  CONTRIBUTOR_INFO: 'contributor_info',
  OTHER: 'other',
} as const

export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType]

export function getClassifyQuestionTool(params: GetClassifyQuestionToolParams) {
  const { organization, answerID: answerId } = params

  return new DynamicStructuredTool({
    name: 'classify_question',
    description: 'Classify the type of question being asked',
    schema: z.object({
      question: z.string().describe('The question to classify'),
    }),
    func: async ({ question }) => {
      logger.debug('Call - Classify Question', {
        event: 'get_answer:classify_question:call',
        answer_id: answerId,
        organization: getOrganizationLogData(organization),
        question,
      })

      // Simple rule-based classification
      const lowerQuestion = question.toLowerCase()
      
      if (lowerQuestion.includes('task') || 
          lowerQuestion.includes('todo') ||
          lowerQuestion.includes('work item')) {
        return QuestionType.TASK_SEARCH
      }
      
      if (lowerQuestion.includes('pr') || 
          lowerQuestion.includes('pull request') ||
          lowerQuestion.includes('merge request') ||
          lowerQuestion.includes('merged') ||
          lowerQuestion.includes('changes')) {
        return QuestionType.PR_SEARCH
      }

      if (lowerQuestion.includes('code') ||
          lowerQuestion.includes('implement') ||
          lowerQuestion.includes('fix') ||
          lowerQuestion.includes('bug')) {
        return QuestionType.CODE_HELP
      }

      if (lowerQuestion.includes('who') ||
          lowerQuestion.includes('contributor') ||
          lowerQuestion.includes('working on')) {
        return QuestionType.CONTRIBUTOR_INFO
      }

      return QuestionType.OTHER
    },
  })
}

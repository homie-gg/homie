import { getQuestionParams } from '@/lib/ai/chat/get-question-params'
import { questions } from '@/lib/ai/chat/questions'
import { answerGeneralQuestion } from '@/lib/ai/chat/answers/00-general-question'

interface AnswerQuestionParams {
  organizationId: number
  question: string
}

export async function answerQuestion(params: AnswerQuestionParams) {
  const { organizationId, question } = params
  const questionParams = await tryGetQuestionParams(question)

  const handler = questions[params.question]
  if (!handler) {
    return answerGeneralQuestion({ question, organizationId })
  }

  return JSON.stringify(questionParams)
}

async function tryGetQuestionParams(question: string) {
  try {
    return await getQuestionParams(question)
  } catch {
    return {
      question: 'UNKNOWN',
      branch: null,
      person: null,
      task: null,
    }
  }
}

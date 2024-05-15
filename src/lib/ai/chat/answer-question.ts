import { getQuestionParams } from '@/lib/ai/chat/get-question-params'
import { questions } from '@/lib/ai/chat/questions'
import { answerGeneralQuestion } from '@/lib/ai/chat/answers/00-general-question'

interface AnswerQuestionParams {
  organization: {
    id: number
    is_persona_enabled: boolean
    persona_positivity_level: number
    persona_g_level: number
    persona_affection_level: number
    persona_emoji_level: number
  }
  question: string
}

export async function answerQuestion(params: AnswerQuestionParams) {
  const { organization, question } = params
  const questionParams = await tryGetQuestionParams(question)

  const handler = questions[params.question]
  if (!handler) {
    return answerGeneralQuestion({ question, organization })
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

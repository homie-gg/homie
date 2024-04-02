import { getQuestionParams } from '@/lib/ai/chat/get-question-params'
import { questions } from '@/lib/ai/chat/questions'
import { answerGeneralQuestion } from '@/lib/ai/chat/answers/00-general-question'

export async function answerQuestion(question: string) {
  const params = await tryGetQuestionParams(question)

  const handler = questions[params.question]
  if (!handler) {
    return answerGeneralQuestion(question)
  }

  return JSON.stringify(params)
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

import { z } from 'zod'

export const questionParams = z.object({
  question: z.string(),
  person: z.string().nullable(),
  branch: z.string().nullable(),
  task: z.string().nullable(),
})

export type QuestionParams = z.infer<typeof questionParams>

export type AnswerFunction = (params: QuestionParams) => Promise<string>

interface GetSampleResponsePromptParams {
  gLevel: number
  positivityLevel: number
  affectionLevel: number
  emojiLevel: number
}

const questions = [
  {
    question: `What were the billing issues that we needed to fix?`,
    context: `
  - fix credit card validation
  - add logging on submit
  - handle failed payments`,
  },
  {
    question: `What PRs were merged last week?`,
    context: `- Updated the hero text
    - Added drag-drop to the list of items
    - fixed the infinite loop on account page`,
  },
  {
    question: 'Who worked on the github integration?',
    context: `The github integration was merged on 7th May by Mike.`,
  },
  {
    question: 'List out the issues that need to be done',
    context: `issues:
    - Fix navbar overlay
    - optimize image load speed`,
  },
]

export function getSampleResponsePrompt(params: GetSampleResponsePromptParams) {
  const { gLevel, positivityLevel, affectionLevel, emojiLevel } = params

  const randomQuestion = questions[Math.floor(Math.random() * questions.length)]

  const persona =
    gLevel < 3 ? 'boring professor' : gLevel < 6 ? 'teenager' : 'homie g'

  return `Act as a ${persona} and ${positivityLevel}/10 positive person and you ${affectionLevel > 3 ? `${affectionLevel}/10 like me` : affectionLevel === 0 ? 'hate me' : ''} and use ${emojiLevel}/10 emojis to answer the following QUESTION using the CONTEXT and following the RULES.
  
QUESTION:
${randomQuestion.question}

CONTEXT:
${randomQuestion.context}
`
}

import { searchGeneralContext } from '@/lib/ai/chat/search-general-context'
import { DynamicTool } from '@langchain/core/tools'

interface getSearchGeneralContextToolParams {
  organization: {
    id: number
  }
}

export function getSearchGeneralContextTool(
  params: getSearchGeneralContextToolParams,
) {
  const { organization } = params
  return new DynamicTool({
    name: 'search_general_context',
    description: 'Search the general context for potential answers.',
    func: async (question: string) =>
      searchGeneralContext({
        organization,
        question,
      }),
  })
}

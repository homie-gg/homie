import { DynamicTool } from '@langchain/core/tools'

export function getTodaysDateTool() {
  return new DynamicTool({
    name: 'get_todays_date',
    description: "Get today's date",
    func: async () => new Date().toISOString(),
  })
}

interface GetDailyReportSummaryBlocksParams {
  numPullRequests: number
  numContributors: number
  numAssignedTasks: number
  addedTasks: Array<{ name: string; html_url: string }>
  completedTasks: Array<{ name: string; html_url: string }>
  pendingTasks: Array<{}>
}

export function getDailyReportSummaryBlocks(
  params: GetDailyReportSummaryBlocksParams,
) {
  const {
    numContributors,
    numPullRequests,
    addedTasks,
    completedTasks,
    numAssignedTasks,
    pendingTasks,
  } = params
  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: 'Daily Report 📋',
        emoji: true,
      },
    },
    {
      type: 'rich_text',
      elements: [
        {
          type: 'rich_text_section',
          elements: [
            {
              type: 'text',
              text: 'Pull Requests\n',
              style: {
                bold: true,
              },
            },
          ],
        },
        {
          type: 'rich_text_list',
          style: 'bullet',
          indent: 0,
          border: 0,
          elements: [
            {
              type: 'rich_text_section',
              elements: [
                {
                  type: 'text',
                  text: `${numPullRequests} merged by ${numContributors} contributors\n\n`,
                },
              ],
            },
          ],
        },
        {
          type: 'rich_text_section',
          elements: [
            {
              type: 'text',
              text: 'Tasks\n',
              style: {
                bold: true,
              },
            },
          ],
        },
        {
          type: 'rich_text_list',
          style: 'bullet',
          indent: 0,
          border: 0,
          elements: [
            {
              type: 'rich_text_section',
              elements: [
                {
                  type: 'text',
                  text: `${addedTasks.length} added\n`,
                },
              ],
            },
            {
              type: 'rich_text_section',
              elements: [
                {
                  type: 'text',
                  text: `${completedTasks.length} completed\n`,
                },
              ],
            },
            {
              type: 'rich_text_section',
              elements: [
                {
                  type: 'text',
                  text: `${numAssignedTasks} assigned\n`,
                },
              ],
            },
            {
              type: 'rich_text_section',
              elements: [
                {
                  type: 'text',
                  text: `${pendingTasks.length} pending\n`,
                },
              ],
            },
          ],
        },
      ],
    },
  ]
}

interface GetAssignedTasksParams {
  contributors: Record<
    number,
    {
      username: string
      ext_slack_member_id: string | null
      id: number
    }
  >
  taskAssignments: Array<{
    name: string
    html_url: string
    assigned_contributor_id: number
    task_id: number
  }>
}

export async function getAssignedTasks(params: GetAssignedTasksParams) {
  const { contributors, taskAssignments } = params

  const assignedTasks: Record<
    number,
    {
      name: string
      html_url: string
      contributors: {
        username: string
        ext_slack_member_id: string | null
        id: number
      }[]
    }
  > = {}
  for (const taskAssignment of taskAssignments) {
    const contributor = contributors[taskAssignment.assigned_contributor_id]
    if (!contributor) {
      continue
    }

    assignedTasks[taskAssignment.task_id] = {
      name: taskAssignment.name,
      html_url: taskAssignment.html_url,
      contributors: [
        ...(assignedTasks[taskAssignment.task_id]?.contributors ?? []),
        contributor,
      ],
    }
  }

  return assignedTasks
}

import { dbClient } from '@/database/client'
import { calculateTaskComplexity } from '@/lib/ai/calculate-task-complexity'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { CalculateTaskComplexity } from '@/queue/jobs'

export async function handleCalculateTaskComplexity(
  job: CalculateTaskComplexity,
) {
  const { task } = job.data

  const organization = await dbClient
    .selectFrom('homie.organization')
    .leftJoin(
      'github.organization',
      'github.organization.organization_id',
      'homie.organization.id',
    )
    .leftJoin(
      'asana.app_user',
      'asana.app_user.organization_id',
      'homie.organization.id',
    )
    .leftJoin(
      'trello.workspace',
      'trello.workspace.organization_id',
      'homie.organization.id',
    )
    .where('homie.organization.id', '=', task.organization_id)
    .select([
      'homie.organization.id',
      'ext_gh_install_id',
      'asana.app_user.asana_access_token',
      'trello.workspace.trello_access_token',
      'complexity_score_per_day',
    ])
    .executeTakeFirstOrThrow()

  logger.debug('Calculate task complexity', {
    event: 'calculate_task_complexity:start',
    data: {
      task,
      organization: getOrganizationLogData(organization),
    },
  })

  const calculateComplexityResult = await calculateTaskComplexity({
    name: task.name,
    description: task.description,
  })

  logger.debug('Checked complexity', {
    event: 'calculate_task_complexity:calculated',
    task,
    organization: getOrganizationLogData(organization),
    ai_call: true,
    prompt: calculateComplexityResult.prompt,
    complexity_score: calculateComplexityResult.score,
    failed: Boolean(calculateComplexityResult.error),
    error: calculateComplexityResult.error,
  })

  if (!calculateComplexityResult.score) {
    return
  }

  const estimatedDaysToComplete = organization.complexity_score_per_day
    ? Math.ceil(
        calculateComplexityResult.score / organization.complexity_score_per_day,
      )
    : null

  await dbClient
    .updateTable('homie.task')
    .where('id', '=', task.id)
    .set({
      complexity_score: calculateComplexityResult.score,
      estimated_days_to_complete: estimatedDaysToComplete,
    })
    .executeTakeFirstOrThrow()
}
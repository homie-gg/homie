import { dbClient } from '@/database/client'
import { subDays } from 'date-fns'

export async function handleCalculateOrganizationComplexityScorePerDay() {
  // Scores are calculated weekly.
  // queue/schedule-jobs.ts for cron pattern
  const lastWeek = subDays(new Date(), 1)

  const organizations = await dbClient
    .selectFrom('homie.organization')
    .select(['id'])
    .execute()

  for (const organization of organizations) {
    const mergedPullRequests = await dbClient
      .selectFrom('homie.pull_request')
      .where('merged_at', 'is not', null)
      .where('merged_at', '>', lastWeek)
      .where('organization_id', '=', organization.id)
      .select(['complexity_score'])
      .execute()

    const totalScore = mergedPullRequests.reduce((acc, i) => {
      return acc + i.complexity_score
    }, 0)

    const averagePerDay = Math.round(totalScore / 7) // calculating weekly

    await dbClient
      .updateTable('homie.organization')
      .where('id', '=', organization.id)
      .set({
        complexity_score_per_day: averagePerDay,
      })
      .executeTakeFirstOrThrow()
  }
}

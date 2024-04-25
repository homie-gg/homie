import { getUserOrganization } from '@/lib/auth/get-user-organization'
import { getPlanLabel } from '@/lib/billing/get-plan-label'
import { dbClient } from '@/database/client'
import { Badge } from '@/lib/ui/Badge'
import Link from 'next/link'

interface PlanBadgeProps {}

export default async function PlanBadge(props: PlanBadgeProps) {
  const {} = props
  const organization = await getUserOrganization()
  if (!organization) {
    return <Badge variant="outline">Free</Badge>
  }

  const subscription = await dbClient
    .selectFrom('voidpm.subscription')
    .innerJoin('voidpm.plan', 'voidpm.plan.id', 'voidpm.subscription.plan_id')
    .select([
      'voidpm.subscription.id',
      'voidpm.plan.name as plan_name',
      'voidpm.plan.billing_interval',
    ])
    .where('organization_id', '=', organization.id)
    .where('stripe_status', '=', 'active')
    .executeTakeFirst()

  if (!subscription) {
    return (
      <Link href="/billing">
        <Badge variant="outline">Free</Badge>
      </Link>
    )
  }

  return (
    <Link href="/billing">
      <Badge>{getPlanLabel(subscription.plan_name)}</Badge>
    </Link>
  )
}

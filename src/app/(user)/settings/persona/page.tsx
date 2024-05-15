import { dbClient } from '@/database/client'
import { Separator } from '@/lib/ui/Separator'
import { auth } from '@clerk/nextjs'
import PersonaSettingsForm from '@/app/(user)/settings/persona/_components/PersonaSettingsForm'

interface ContributorsPageProps {}

export default async function ContributorsPage(props: ContributorsPageProps) {
  const {} = props

  const { userId } = auth()

  if (!userId) {
    return null
  }

  const organization = await dbClient
    .selectFrom('homie.organization')
    .where('ext_clerk_user_id', '=', userId)
    .select([
      'id',
      'is_persona_enabled',
      'persona_affection_level',
      'persona_emoji_level',
      'persona_g_level',
      'persona_positivity_level',
    ])
    .executeTakeFirst()

  if (!organization) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Persona</h3>
        <p className="text-sm text-muted-foreground">
          Customize how homie speaks to match your team&apos;s vibe, or just for
          fun.
        </p>
      </div>
      <Separator />

      <div className="space-y-4">
        <PersonaSettingsForm organization={organization} />
      </div>
    </div>
  )
}

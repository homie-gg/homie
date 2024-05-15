/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(
    {
      schema: 'homie',
      name: 'organization',
    },
    {
      is_persona_enabled: {
        type: 'boolean',
        default: false,
        notNull: true,
      },
    },
  )

  pgm.addColumn(
    {
      schema: 'homie',
      name: 'organization',
    },
    {
      persona_g_level: {
        type: 'integer',
        default: 10,
        notNull: true,
      },
    },
  )

  pgm.addColumn(
    {
      schema: 'homie',
      name: 'organization',
    },
    {
      persona_positivity_level: {
        type: 'integer',
        default: 10,
        notNull: true,
      },
    },
  )

  pgm.addColumn(
    {
      schema: 'homie',
      name: 'organization',
    },
    {
      persona_affection_level: {
        type: 'integer',
        default: 10,
        notNull: true,
      },
    },
  )

  pgm.addColumn(
    {
      schema: 'homie',
      name: 'organization',
    },
    {
      persona_emoji_level: {
        type: 'integer',
        default: 10,
        notNull: true,
      },
    },
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns('homie', [
    'is_persona_enabled',
    'persona_g_level',
    'persona_positivity_level',
    'persona_affection_level',
    'persona_emoji_level',
  ])
}

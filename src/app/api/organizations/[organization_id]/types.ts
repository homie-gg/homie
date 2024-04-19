import { z } from 'zod'

export const organizationData = z.object({
  send_pull_request_summaries_enabled: z.boolean(),
  send_pull_request_summaries_interval: z.union([
    z.literal('weekly'),
    z.literal('daily'),
  ]),
  send_pull_request_summaries_day: z.union([
    z.literal('0'),
    z.literal('1'),
    z.literal('2'),
    z.literal('3'),
    z.literal('4'),
    z.literal('5'),
    z.literal('6'),
  ]),
  send_pull_request_summaries_time: z
    .string()
    .refine((value) => /^\d\d:\d\d$/.test(value), 'Must be hh:mm'),
})

export type OrganizationData = z.infer<typeof organizationData>

export const organizationResponse = z.object({
  id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  send_pull_request_summaries_interval: z.string(),
  send_pull_request_summaries_day: z.string(),
  send_pull_request_summaries_time: z.string(),
})

export type OrganizationResponse = z.infer<typeof organizationResponse>

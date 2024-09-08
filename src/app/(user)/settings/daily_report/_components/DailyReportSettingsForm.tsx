'use client'

import { Switch } from '@/lib/ui/Switch'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/lib/ui/Form'
import { useForm } from 'react-hook-form'
import { Label } from '@/lib/ui/Label'
import { useState } from 'react'
import { Button } from '@/lib/ui/Button'
import { Input } from '@/lib/ui/Input'
import { Organization } from '@/database/types'
import { http } from '@/lib/http/client/http'
import {
  OrganizationData,
  OrganizationResponse,
  organizationData,
} from '@/app/api/organizations/[organization_id]/types'
import { useToast } from '@/lib/ui/Toast/use-toast'
import { format } from 'date-fns'
import { getLocalDate } from '@/lib/date/get-local-date'
import { getDate as getDate } from '@/lib/date/get-date'
import { formatInTimeZone } from 'date-fns-tz'

interface DailyReportSettingsFormProps {
  organization: Organization
}


export default function DailyReportSettingsForm(
  props: DailyReportSettingsFormProps,
) {
  const [organization, setOrganization] = useState<Organization>(
    props.organization,
  )
  const { toast } = useToast()

  const [processing, setProcessing] = useState(false)

  const setEnabled = (enabled: boolean) => {
    submit({
      send_daily_report_enabled: enabled,
      send_daily_report_time: organization.send_daily_report_time,
    })
  }

  const submit = (data: Partial<OrganizationData>) => {
    if (processing) {
      return
    }

    setProcessing(true)

    const localDate = getDate({
      day: 0,
      hours: parseInt((data.send_daily_report_time ?? '').split(':')[0]),
      minutes: parseInt((data.send_daily_report_time ?? '').split(':')[1]),
    })

    const time = formatInTimeZone(localDate, 'UTC', 'kk:mm')

    http
      .patch<{ organization: OrganizationResponse }>(
        `/api/organizations/${organization.id}`,
        {
          ...data,
          send_daily_report_time: time,
        },
      )
      .then(() => {
        setOrganization({
          ...organization,
          ...data,
        })
        toast({
          title: 'Saved',
          description: 'Daily Report settings have been updated.',
        })
      })
      .catch(() => {
        toast({
          title: 'Error: could not save settings',
          variant: 'destructive',
        })
      })
      .finally(() => {
        setProcessing(false)
      })
  }

  const localDate = getLocalDate({
    day: 0,
    hours: parseInt(organization.send_daily_report_time.split(':')[0]),
    minutes: parseInt(organization.send_daily_report_time.split(':')[1]),
  })

  const form = useForm<OrganizationData>({
    resolver: zodResolver(organizationData.partial()),
    defaultValues: {
      send_daily_report_time: format(localDate, 'kk:mm'),
    },
  })

  return (
    <div>
      <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mb-8">
        <div className="space-y-0.5">
          <Label>Enabled</Label>
          <p className="text-[0.8rem] text-muted-foreground">
            Homie will send a Daily Report
          </p>
        </div>
        <Switch
          checked={organization.send_daily_report_enabled}
          onCheckedChange={setEnabled}
        />
      </div>
      {organization.send_daily_report_enabled && (
        <div>
          <p className="mb-4 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70p">
            Settings
          </p>
          <div className="rounded-lg border p-3 shadow-sm">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(submit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="send_daily_report_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input placeholder="09:00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Save</Button>
              </form>
            </Form>
          </div>
        </div>
      )}
    </div>
  )
}

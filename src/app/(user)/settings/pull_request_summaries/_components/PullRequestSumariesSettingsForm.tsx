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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/lib/ui/Select'
import { Button } from '@/lib/ui/Button'
import { Input } from '@/lib/ui/Input'
import { Organization } from '@/lib/db/types'
import { http } from '@/lib/http/client/http'
import {
  OrganizationData,
  OrganizationResponse,
  organizationData,
} from '@/app/api/organizations/[organization_id]/types'
import { useToast } from '@/lib/ui/Toast/use-toast'
import { format } from 'date-fns'
import { getLocalDate } from '@/lib/date/get-local-date'
import { getUTCDate } from '@/lib/date/get-utc-date'

interface EnablePullRequestSummariesSwitchProps {
  organization: Organization
}

export default function PullRequestSumariesSettingsForm(
  props: EnablePullRequestSummariesSwitchProps,
) {
  const [organization, setOrganization] = useState<Organization>(
    props.organization,
  )
  const { toast } = useToast()

  const [processing, setProcessing] = useState(false)

  const setEnabled = (enabled: boolean) => {
    submit({ send_pull_request_summaries_enabled: enabled })
  }

  const submit = (data: Partial<OrganizationData>) => {
    if (processing) {
      return
    }

    setProcessing(true)

    const utcDate = getUTCDate({
      day: parseInt(data.send_pull_request_summaries_day ?? ''),
      hours: parseInt(
        (data.send_pull_request_summaries_time ?? '').split(':')[0],
      ),
      minutes: parseInt(
        (data.send_pull_request_summaries_time ?? '').split(':')[1],
      ),
    })

    // const utc = addMinutes(m, new Date().getTimezoneOffset())

    const hours = format(utcDate, 'kk')
    const localizedHours = hours === '24' ? '00' : hours
    const minutes = format(utcDate, 'mm')

    http
      .patch<{ organization: OrganizationResponse }>(
        `/api/organizations/${organization.id}`,
        {
          ...data,
          send_pull_request_summaries_day: utcDate.getDay().toString(),
          send_pull_request_summaries_time: `${localizedHours}:${minutes}`,
        },
      )
      .then(() => {
        setOrganization({
          ...organization,
          ...data,
        })
        toast({
          title: 'Saved',
          description: 'Pull request summary settings have been updated.',
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

  const dateTime = getLocalDate({
    day: parseInt(organization.send_pull_request_summaries_day),
    hours: parseInt(
      organization.send_pull_request_summaries_time.split(':')[0],
    ),
    minutes: parseInt(
      organization.send_pull_request_summaries_time.split(':')[1],
    ),
  })

  const form = useForm<OrganizationData>({
    resolver: zodResolver(organizationData.partial()),
    defaultValues: {
      send_pull_request_summaries_interval:
        organization.send_pull_request_summaries_interval as any,
      send_pull_request_summaries_day: dateTime.getDay().toString() as any,
      send_pull_request_summaries_time: format(dateTime, 'kk:mm'),
    },
  })

  const isWeekly =
    form.watch('send_pull_request_summaries_interval') === 'weekly'

  return (
    <div>
      <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mb-8">
        <div className="space-y-0.5">
          <Label>Enabled</Label>
          <p className="text-[0.8rem] text-muted-foreground">
            Void will send a list of merged pull requests.
          </p>
        </div>
        <Switch
          checked={organization.send_pull_request_summaries_enabled}
          onCheckedChange={setEnabled}
        />
      </div>
      {organization.send_pull_request_summaries_enabled && (
        <div>
          <p className="mb-4 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70p">
            Settings
          </p>
          <div className="rounded-lg border p-3 shadow-sm">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(submit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="send_pull_request_summaries_interval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interval</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Theme" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isWeekly && (
                  <FormField
                    control={form.control}
                    name="send_pull_request_summaries_day"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Theme" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Monday</SelectItem>
                              <SelectItem value="2">Tuesday</SelectItem>
                              <SelectItem value="3">Wednesday</SelectItem>
                              <SelectItem value="4">Thursday</SelectItem>
                              <SelectItem value="5">Friday</SelectItem>
                              <SelectItem value="6">Saturday</SelectItem>
                              <SelectItem value="0">Sunday</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="send_pull_request_summaries_time"
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

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
import { http } from '@/lib/http/client/http'
import {
  OrganizationData,
  OrganizationResponse,
  organizationData,
} from '@/app/api/organizations/[organization_id]/types'
import { useToast } from '@/lib/ui/Toast/use-toast'
import { Slider } from '@/lib/ui/Slider'
import { AnimatePresence, motion } from 'framer-motion'
import slackBg from '@/app/_components/slack-bg.jpg'
import Image from 'next/image'
import SlackMessage from '@/lib/ui/SlackMessage'

interface PersonaSettingsFormProps {
  organization: {
    id: number
    is_persona_enabled: boolean
    persona_positivity_level: number
    persona_g_level: number
    persona_affection_level: number
    persona_emoji_level: number
  }
}

export default function PersonaSettingsForm(props: PersonaSettingsFormProps) {
  const [organization, setOrganization] = useState<
    PersonaSettingsFormProps['organization']
  >(props.organization)

  const { toast } = useToast()

  const [processing, setProcessing] = useState(false)
  const [sampleResponse, setSampleResponse] = useState(
    'Yo homie! Last week we merged some lit PRs 🚀🎉\n1. Updated the hero text 🦸‍♂️\n2. Added drag-drop feature to the list of items 🔄\n3. Fixed the infinite loop on the account page 🔧\n\nKeep up the good work fam! 💯🔥🙌 #PositiveVibesOnly',
  )

  const setEnabled = (enabled: boolean) => {
    submit({ is_persona_enabled: enabled })
  }

  const submit = (data: Partial<OrganizationData>) => {
    if (processing) {
      return
    }

    setProcessing(true)

    http
      .patch<{ organization: OrganizationResponse }>(
        `/api/organizations/${organization.id}`,
        data,
      )
      .then(() => {
        setOrganization({
          ...organization,
          ...data,
        })
        toast({
          title: 'Saved',
          description: 'Persona settings updated.',
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

  const form = useForm<OrganizationData>({
    resolver: zodResolver(organizationData.partial()),
    defaultValues: {
      persona_affection_level: organization.persona_affection_level,
      persona_g_level: organization.persona_g_level,
      persona_positivity_level: organization.persona_positivity_level,
      persona_emoji_level: organization.persona_emoji_level,
    },
  })

  const [
    persona_g_level,
    persona_positivity_level,
    persona_affection_level,
    persona_emoji_level,
  ] = form.watch([
    'persona_g_level',
    'persona_positivity_level',
    'persona_affection_level',
    'persona_emoji_level',
  ])

  const getSampleResponse = () => {
    setSampleResponse('')

    http
      .post<{ message: string }>('/api/demo/sample_response', {
        persona_g_level,
        persona_positivity_level,
        persona_affection_level,
        persona_emoji_level,
      })
      .then((data) => setSampleResponse(data.message))
  }

  return (
    <div>
      <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mb-8">
        <div className="space-y-0.5">
          <Label>Enabled</Label>
          <p className="text-[0.8rem] text-muted-foreground">
            homie will talk with the persona you configure below.
          </p>
        </div>
        <Switch
          checked={organization.is_persona_enabled}
          onCheckedChange={setEnabled}
        />
      </div>
      {organization.is_persona_enabled && (
        <div>
          <p className="mb-4 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70p">
            Settings
          </p>
          <div className="rounded-lg border p-3 shadow-sm">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(submit)}
                className="space-y-8 mb-8"
              >
                <FormField
                  control={form.control}
                  name="persona_g_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>💵 How much of a g?</FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={10}
                          step={1}
                          className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                          aria-label="g level"
                          defaultValue={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="persona_positivity_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>🌈 Positivity</FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={10}
                          step={1}
                          className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                          aria-label="positivity"
                          defaultValue={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="persona_affection_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel> ❤️ How much does homie like you?</FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={10}
                          step={1}
                          className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                          aria-label="like level"
                          defaultValue={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="persona_emoji_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>💩 How many emojis?</FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={10}
                          step={1}
                          className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                          aria-label="emoji level"
                          defaultValue={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit">Save</Button>
                <Button
                  type="button"
                  variant="outline"
                  className="ml-4"
                  onClick={getSampleResponse}
                >
                  See Sample Response
                </Button>
              </form>
            </Form>

            <SlackMessage message={sampleResponse} />
          </div>
        </div>
      )}
    </div>
  )
}

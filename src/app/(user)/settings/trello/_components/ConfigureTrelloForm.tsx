'use client'

import { http } from '@/lib/http/client/http'
import { TrelloBoard, TrelloList } from '@/lib/trello/types'
import { Button } from '@/lib/ui/Button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/lib/ui/Form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/lib/ui/Select'
import { useToast } from '@/lib/ui/Toast/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

interface ConfigureTrelloFormProps {
  trelloBoards: TrelloBoard[]
  trelloWorkspace: {
    trello_access_token: string
    ext_trello_board_id: string | null
    ext_trello_new_task_list_id: string | null
    ext_trello_done_task_list_id: string | null
  }
  organization: {
    id: number
  }
}

const configureTrelloData = z.object({
  ext_trello_board_id: z.string(),
  ext_trello_new_task_list_id: z.string(),
  ext_trello_done_task_list_id: z.string(),
})

type ConfigureTrelloData = z.infer<typeof configureTrelloData>

export default function ConfigureTrelloForm(props: ConfigureTrelloFormProps) {
  const { trelloBoards, trelloWorkspace, organization } = props
  const { id: organizationId } = organization

  const { trello_access_token } = trelloWorkspace

  const [lists, setLists] = useState<TrelloList[]>([])
  const [processing, setProcessing] = useState(false)

  const { toast } = useToast()

  const form = useForm<ConfigureTrelloData>({
    resolver: zodResolver(configureTrelloData),
    defaultValues: {
      ext_trello_board_id: trelloWorkspace.ext_trello_board_id ?? undefined,
      ext_trello_new_task_list_id:
        trelloWorkspace.ext_trello_new_task_list_id ?? undefined,
      ext_trello_done_task_list_id:
        trelloWorkspace.ext_trello_done_task_list_id ?? undefined,
    },
  })

  const boardId = form.watch('ext_trello_board_id')

  useEffect(() => {
    if (!boardId) {
      return
    }

    setLists([])

    http
      .get<{
        lists: TrelloList[]
      }>(`/api/organizations/${organizationId}/trello/boards/${boardId}/lists`)
      .then((data) => setLists(data.lists))
  }, [boardId, trello_access_token, organizationId])

  const submit = (data: ConfigureTrelloData) => {
    if (processing) {
      return
    }

    setProcessing(true)

    http
      .patch(`/api/organizations/${organization.id}/trello/settings`, data)
      .then(() => {
        toast({
          title: 'Saved',
          description: 'Trello settings have been updated.',
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-8">
        <FormField
          control={form.control}
          name="ext_trello_board_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Board</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={processing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select one" />
                  </SelectTrigger>
                  <SelectContent>
                    {trelloBoards.map((trelloBoard) => (
                      <SelectItem value={trelloBoard.id} key={trelloBoard.id}>
                        {trelloBoard.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ext_trello_new_task_list_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Task List</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={lists.length === 0 || processing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select one" />
                  </SelectTrigger>
                  <SelectContent>
                    {lists.map((list) => (
                      <SelectItem value={list.id} key={list.id}>
                        {list.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                New tasks will be added to this list.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ext_trello_done_task_list_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Completed Task List</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={lists.length === 0 || processing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select one" />
                  </SelectTrigger>
                  <SelectContent>
                    {lists.map((list) => (
                      <SelectItem value={list.id} key={list.id}>
                        {list.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                Cards will be moved here when linked PRs are closed.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="mt-4" disabled={processing}>
          Save
        </Button>
      </form>
    </Form>
  )
}

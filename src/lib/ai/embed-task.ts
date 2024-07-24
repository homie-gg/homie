import { getPineconeClient } from '@/lib/pinecone/pinecone-client'
import { PineconeRecord, RecordMetadata } from '@pinecone-database/pinecone'
import { createOpenAIEmbedder } from '@/lib/open-ai/create-open-ai-embedder'
import { dbClient } from '@/database/client'
import { getPriorityLabel } from '@/lib/tasks/task-priority'

interface EmbedTaskParams {
  task: {
    id: number
    name: string
    description: string
    task_status_id: number
    task_type_id: number
    organization_id: number
    html_url: string
    due_date: Date | null
    completed_at: Date | null
    priority_level: number
    created_at: Date
  }
}

export interface TaskMetadata extends RecordMetadata {
  type: 'task'
  organization_id: number
  task_id: number
  task_status: string
  task_type: string
  text: string
  priority_level: number
  due_date: string
  created_at: string
  completed_at: string
}

export async function embedTask(params: EmbedTaskParams) {
  const { task } = params

  const embedder = createOpenAIEmbedder({
    modelName: 'text-embedding-3-large',
  })

  const status = await dbClient
    .selectFrom('homie.task_status')
    .where('homie.task_status.id', '=', task.task_status_id)
    .select(['name'])
    .executeTakeFirstOrThrow()

  const type = await dbClient
    .selectFrom('homie.task_type')
    .where('homie.task_type.id', '=', task.task_type_id)
    .select(['name'])
    .executeTakeFirstOrThrow()

  const attributes = [
    `Task: ${task.name}`,
    `Description: ${task.description}`,
    `Status: ${status.name}`,
    `Type: ${type.name}`,
    `URL: ${task.html_url}`,
    `Priority: ${getPriorityLabel(task.priority_level)}`,
  ]

  if (task.due_date) {
    attributes.push(`Due Date: ${task.due_date}`)
  }

  if (task.completed_at) {
    attributes.push(`Completed on: ${task.completed_at}`)
  }

  const text = attributes.join(', ')

  const embedding = await embedder.embedQuery(text)

  const metadata: TaskMetadata = {
    type: 'task',
    organization_id: task.organization_id,
    task_id: task.id,
    task_status: status.name,
    task_type: type.name,
    text,
    priority_level: task.priority_level,
    created_at: task.created_at.toISOString(),
    due_date: task.due_date?.toISOString() ?? '',
    completed_at: task.completed_at?.toISOString() ?? '',
  }

  const record: PineconeRecord = {
    id: `task_${task.id}`,
    values: embedding,
    metadata,
  }

  const index = getPineconeClient().Index(process.env.PINECONE_INDEX_MAIN!)

  await index.upsert([record])
}

import { PineconeRecord, RecordMetadata } from '@pinecone-database/pinecone'
import { dbClient } from '@/database/client'
import { getOrganizationVectorDB } from '@/lib/ai/get-organization-vector-db'
import { createOpenAIClient } from '@/lib/open-ai/create-open-ai-client'

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

  const text = `${task.name}\n${task.description}`

  const openAI = createOpenAIClient()
  const embedding = (
    await openAI.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
    })
  ).data[0].embedding

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

  const vectorDB = getOrganizationVectorDB(task.organization_id)

  await vectorDB.upsert([record])
}

import { RecordMetadata } from '@pinecone-database/pinecone'
import { getOrganizationVectorDB } from '@/lib/ai/get-organization-vector-db'

interface RemoveTaskEmbeddingParams {
  task: {
    id: number
    organization_id: number
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

export async function removeTaskEmbedding(params: RemoveTaskEmbeddingParams) {
  const { task } = params

  const vectorDB = getOrganizationVectorDB(task.organization_id)

  const id = `task_${task.id}`
  await vectorDB.deleteOne(id)
}

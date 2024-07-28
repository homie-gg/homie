import { CheckForDuplicateTask } from '@/queue/jobs'

export async function handleCheckForDuplicateTask(job: CheckForDuplicateTask) {
  const { task } = job.data

  // TODO:
  // search for another task that is similar
  // use high confidence score
  // filter out THIS task id to make sure not the same task

  // if a duplicate is found:
  // send a comment to whether the task is created, saying that this might
  // be a duplicate task of X
}

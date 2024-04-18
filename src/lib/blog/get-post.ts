import { readPostFile } from '@/lib/blog/read-post-file'

export function getPost(urlPaths: string[]) {
  try {
    return readPostFile(urlPaths)
  } catch {
    return null
  }
}

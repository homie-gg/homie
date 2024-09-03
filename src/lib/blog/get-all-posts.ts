import { join } from 'node:path'
import { getFiles } from '@/lib/storage/get-files'
import { readPostFile } from '@/lib/blog/read-post-file'

export function getAllPosts() {
  const files = getFiles('blog', '.mdx')

  const slugs = files.map((fileName) => {
    const slug = fileName.replace('.mdx', '').split('/')
    slug.shift() // remove /blog
    return slug
  })

  const posts = []

  for (const slug of slugs) {
    try {
      const { content: _content, ...frontmatter } = readPostFile(slug)
      posts.push({ ...frontmatter, path: join('blog', ...slug) })
    } catch {
      // ignore bad post
    }
  }

  return posts
}

import fs from 'node:fs'
import matter from 'gray-matter'
import path from 'node:path'
import { BlogPostData } from '@/lib/blog/types'

export function readPostFile(urlPaths: string[]): BlogPostData {
  const postPath = urlPaths.join('/')
  const filePath = path.join('blog', postPath + '.mdx')
  const markdownFile = fs.readFileSync(filePath, 'utf8')

  const { data: frontMatter, content } = matter(markdownFile)

  return {
    ...(frontMatter as any),
    content,
  }
}

import { getAllPosts } from '@/lib/blog/get-all-posts'
import Link from 'next/link'

interface BlogProps {}

export default function Blog(props: BlogProps) {
  const {} = props

  const posts = getAllPosts()

  const sortedPosts = posts.sort(
    (aPost, bPost) =>
      (bPost.date?.getTime() ?? 0) - (aPost.date?.getTime() ?? 0),
  )
  return (
    <div className="max-w-[692px] mx-auto my-16">
      <h2 className="mb-5 block font-medium sm:mb-4">Feature Releases</h2>
      <div className="flex flex-col gap-7 sm:gap-4">
        {sortedPosts.map((post) => (
          <Link
            key={post.path}
            href={`/${post.path}`}
            className="-mx-3 flex flex-col rounded-md px-3 no-underline hover:bg-[#F5F4F4] dark:hover:bg-gray-200 sm:py-3"
          >
            <span>{post.title}</span>
            <span className="text-gray-500">{post.excerpt}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

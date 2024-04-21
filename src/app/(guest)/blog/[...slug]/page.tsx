import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getPost } from '@/lib/blog/get-post'
import rehypeHighlight from 'rehype-highlight'
import { Badge } from '@/lib/ui/Badge'

interface BlogPostProps {
  params: {
    slug: string[]
  }
}

export default function BlogPost(props: BlogPostProps) {
  const {
    params: { slug },
  } = props

  const post = getPost(slug)
  if (!post) {
    return notFound()
  }

  return (
    <div className="max-w-[692px] mx-auto my-16">
      {post.type && <Badge className="mb-4">{post.type}</Badge>}
      <MDXRemote
        source={post.content}
        options={{
          mdxOptions: {
            remarkPlugins: [],
            // @ts-expect-error: rehypeHighlight plugin doesn't fit MDXRemote types
            rehypePlugins: [rehypeHighlight],
          },
        }}
        components={{
          h1: (props) => <h1 className="mb-5 font-semibold" {...props} />,
          h2: (props) => (
            <h2 className="mb-5 mt-16 font-semibold md:mt-16" {...props} />
          ),
          p: (props) => <p className="mb-6 opacity-90" {...props} />,
          img: (props) => (
            <span className="block border overflow-hidden my-6 rounded-xl shadow-md md:my-8">
              {/* eslint-disable-next-line  */}
              <img {...props} />
            </span>
          ),
          li: (props) => <li className="list-disc ml-4" {...props} />,
        }}
      />
    </div>
  )
}

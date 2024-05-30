import { Alert } from '@/lib/ui/Alert'
import type { MDXComponents } from 'mdx/types'
import Image, { ImageProps } from 'next/image'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    h1: (props) => (
      <h1
        className="scroll-m-20 text-4xl font-bold tracking-tight mb-2"
        {...props}
      />
    ),

    h2: (props) => (
      <h2
        className="mt-12 scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight first:mt-0"
        {...props}
      />
    ),
    h3: (props) => (
      <h3
        className="font-heading mt-8 scroll-m-20 text-xl font-semibold tracking-tight"
        {...props}
      />
    ),
    Description: (props) => (
      <p className="text-lg text-muted-foreground mb-8" {...props} />
    ),
    p: (props) => (
      <p className="leading-7 [&:not(:first-child)]:mt-6" {...props} />
    ),
    Alert: (props) => <Alert className="mt-4" {...props} />,
  }
}

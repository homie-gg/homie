import type { MDXComponents } from 'mdx/types'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    h1: (props) => (
      <h1
        className="scroll-m-20 text-4xl font-bold tracking-tight mb-2"
        {...props}
      />
    ),
    p: (props) => (
      <p className="leading-7 [&:not(:first-child)]:mt-6" {...props} />
    ),
    Description: (props) => (
      <p className="text-lg text-muted-foreground mb-8" {...props} />
    ),
  }
}

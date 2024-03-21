interface ContentProps {
  children: React.ReactNode
}

export default async function Content(props: ContentProps) {
  const { children } = props

  return <div className="flex-1 space-y-4 p-8 pt-6">{children}</div>
}

import DocsNavLink from '@/app/(guest)/docs/_components/DocsNavLink'
import { cn } from '@/lib/utils'

interface Category {
  path: string
  label: string
  pages: Page[]
}

interface Page {
  path: string
  label: string
}

interface DocsNavItemsProps {
  categories: Category[]
}

export default function DocsNavItems(props: DocsNavItemsProps) {
  const { categories } = props

  return (
    <>
      {categories.map((category) => (
        <div className="pb-4" key={category.path}>
          <h4 className="mb-1 rounded-md px-2 py-1 text-sm font-semibold">
            {category.label}
          </h4>
          <div className="grid grid-flow-row auto-rows-max text-sm">
            {category.pages.map((page) => (
              <DocsNavLink
                key={page.path}
                path={`/docs${category.path}${page.path}`}
                label={page.label}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

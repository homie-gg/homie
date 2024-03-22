import { Column } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { PropsWithChildren } from 'react'

type DataTableSortableHeaderProps<TData> = PropsWithChildren & {
  column: Column<TData>
}

export default function DataTableSortableHeader<TData>(
  props: DataTableSortableHeaderProps<TData>,
) {
  const { column, children } = props

  return (
    <span
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      className="px-0 text-muted-foreground cursor-pointer flex items-center"
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </span>
  )
}

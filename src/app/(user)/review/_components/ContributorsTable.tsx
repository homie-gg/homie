import ContributorsTableRows from '@/app/(user)/review/_components/ContributorsTableRows'
import { GithubUser } from '@/lib/db/types'
import DataTable from '@/lib/ui/DataTable'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/lib/ui/Table'
import {
  ColumnDef,
} from '@tanstack/react-table'

export interface Contributor {
  username: string
  prCount: number
}

export const columns: ColumnDef<Contributor>[] = [
  {
    accessorKey: 'username',
    header: 'Github Username',
  },
  {
    accessorKey: 'prCount',
    header: 'PR Count',
  },
]

export default function ContributorsTable() {
  return <DataTable columns={columns} data={[]} />
}

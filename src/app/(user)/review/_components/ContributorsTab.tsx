import ContributorsTable from '@/app/(user)/review/_components/ContributorsTable'
import ContributorsTableRows from '@/app/(user)/review/_components/ContributorsTableRows'
import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from '@/lib/ui/Table'

interface ContributorsTabProps {}

export default async function ContributorsTab(props: ContributorsTabProps) {
  const {} = props

  return <ContributorsTable />
}

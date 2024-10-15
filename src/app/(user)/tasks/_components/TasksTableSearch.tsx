import { Input } from '@/lib/ui/HomieInput'
import styles from './TasksTableSearch.module.scss'
import { Search } from 'lucide-react'

interface TasksTableSearchProps {
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
}

export default function TasksTableSearch(props: TasksTableSearchProps) {
  const { searchTerm, setSearchTerm } = props
  return (
    <div className={styles.container}>
      <span className={styles.icon}>
        <Search />
      </span>
      <Input
        value={searchTerm}
        placeholder="Search"
        className={styles.input}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  )
}

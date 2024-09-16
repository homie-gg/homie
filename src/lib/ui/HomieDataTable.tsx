'use client'

import React from 'react'
import clsx from 'clsx'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/lib/ui/HomieTable'

import styles from './HomieDataTable.module.scss'

type Props = {
  data: {
    headings: React.ReactNode[]
    rows: Array<React.ReactNode[]>
  }
  className?: string
}

const DataTable = ({ data, className = '' }: Props) => {
  const { headings, rows } = data
  return (
    <div className={clsx(styles.main, className)}>
      <Table>
        <TableHeader>
          <TableRow className={styles.row}>
            {headings.map((heading, index) => (
              <TableHead key={index} className={styles.head}>
                {heading}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index} className={styles.row}>
              {row.map((item, index) => (
                <TableCell key={index} className={styles.cell}>
                  {item}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default DataTable

import type { ReactNode, Key } from 'react'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'

/** Definition of a column: header and cell renderer */
export interface Column<Row> {
  header: ReactNode
  cell: (row: Row, index: number) => ReactNode
}

/**
 * Generic table for rendering rows with dynamic columns.
 * Optionally accepts a getRowProps callback for per-row key/className.
 */
export function SongTable<Row>({
  rows,
  columns,
  getRowProps,
}: {
  rows: Row[]
  columns: Column<Row>[]
  getRowProps?: (row: Row, index: number) => { key: Key; className?: string }
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col, idx) => (
            <TableHead key={idx}>{col.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, rowIndex) => {
          const props = getRowProps?.(row, rowIndex) ?? { key: rowIndex }
          return (
            <TableRow key={props.key} className={props.className}>
              {columns.map((col, colIndex) => (
                <TableCell key={colIndex}>{col.cell(row, rowIndex)}</TableCell>
              ))}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
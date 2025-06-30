import type { ReactNode, Key } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { AnimatePresence } from "framer-motion";

/** Definition of a column: header and cell renderer */
export interface Column<Row> {
  id?: string;
  header: ReactNode;
  cell: (row: Row, index: number) => ReactNode;
}

/**
 * Generic table for rendering rows with dynamic columns.
 * Optionally accepts a getRowProps callback for per-row key/className.
 */
export function SongTable<Row>({
  rows,
  columns,
  getRowProps,
  renderRow,
}: {
  rows: Row[];
  columns: Column<Row>[];
  getRowProps?: (row: Row, index: number) => { key: Key; className?: string };
  renderRow?: (
    row: Row,
    columns: Column<Row>[],
    getRowProps?: (row: Row, index: number) => { key: Key; className?: string }
  ) => ReactNode;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col, idx) => (
            <TableHead key={col.id ?? idx}>{col.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        <AnimatePresence>
          {rows.map((row, rowIndex) => {
            if (renderRow) {
              return renderRow(row, columns, getRowProps);
            }
            const props = getRowProps?.(row, rowIndex) ?? { key: rowIndex };
            return (
              <TableRow key={props.key} className={props.className}>
                {columns.map((col, colIndex) => (
                  <TableCell key={col.id ?? colIndex}>
                    {col.cell(row, rowIndex)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </AnimatePresence>
      </TableBody>
    </Table>
  );
}

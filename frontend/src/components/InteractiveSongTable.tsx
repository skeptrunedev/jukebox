import type { DragEndEvent } from "@dnd-kit/core";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SongTable } from "./SongTable";
import type { Column } from "./SongTable";
import type { SongRow } from "@/lib/player";
import { TableCell, TableRow } from "./ui/table";
import type { Key } from "react";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import { updateBoxSong } from "@/sdk";
import { GripVertical } from "lucide-react";

const SortableRow = ({
  row,
  columns,
  getRowProps,
}: {
  row: SongRow;
  columns: Column<SongRow>[];
  getRowProps?: (
    row: SongRow,
    index: number
  ) => { key: Key; className?: string };
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: row.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const rowProps = getRowProps?.(row, 0) ?? { key: row.id };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      {...attributes}
      key={rowProps.key}
      className={rowProps.className}
    >
      <TableCell
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-2 touch-none select-none"
        style={{ touchAction: "none" }}
      >
        <div className="flex items-center justify-center w-6 h-6">
          <GripVertical className="w-4 h-4" />
        </div>
      </TableCell>
      {columns.map((col, colIndex) => (
        <TableCell key={colIndex}>{col.cell(row, 0)}</TableCell>
      ))}
    </TableRow>
  );
};

export function InteractiveSongTable({
  rows,
  columns,
  onOrderChange,
  getRowProps,
}: {
  rows: SongRow[];
  columns: Column<SongRow>[];
  onOrderChange: (rows: SongRow[]) => void;
  getRowProps?: (
    row: SongRow,
    index: number
  ) => { key: Key; className?: string };
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = rows.findIndex((row) => row.id === active.id);
      const newIndex = rows.findIndex((row) => row.id === over.id);
      onOrderChange(arrayMove(rows, oldIndex, newIndex));

      const movedSongId = active.id as string;
      const targetSong = rows[newIndex];
      if (targetSong) {
        updateBoxSong(movedSongId, { position: targetSong.position });
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext
        items={rows.map((row) => row.id)}
        strategy={verticalListSortingStrategy}
      >
        <SongTable<SongRow>
          rows={rows}
          columns={[
            {
              id: "drag-handle",
              header: "",
              cell: () => null,
            },
            ...columns,
          ]}
          getRowProps={getRowProps}
          renderRow={(row, columns, getRowProps) => (
            <SortableRow
              key={row.id}
              row={row}
              columns={columns.slice(1)}
              getRowProps={getRowProps}
            />
          )}
        />
      </SortableContext>
    </DndContext>
  );
}

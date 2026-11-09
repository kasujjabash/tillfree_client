"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type OnChangeFn,
  type Row,
  type RowSelectionState,
  type SortingState,
  type Table as TanstackTable,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";

import { ErrorState } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * Server-driven data table. Sorting, filtering and pagination happen in Django;
 * the table renders one page and reports state changes upward. Below `md` it
 * switches to a stacked list supplied by `renderMobileRow`.
 */

export interface CursorPaginationProps {
  pageIndex: number;
  pageSize: number;
  rowCount: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onNext: () => void;
  onPrevious: () => void;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[] | undefined;
  getRowId: (row: T) => string;
  isLoading: boolean;
  isFetching?: boolean;
  error?: unknown;
  onRetry?: () => void;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  /** Enables the checkbox column. */
  enableSelection?: boolean;
  /** Rendered in place of the toolbar while rows are selected. */
  bulkActions?: (rows: T[], clear: () => void) => React.ReactNode;
  /** Receives the table instance so controls like column visibility can bind to it. */
  toolbar?: (table: TanstackTable<T>) => React.ReactNode;
  pagination: CursorPaginationProps;
  emptyState: React.ReactNode;
  renderMobileRow: (row: T) => React.ReactNode;
  /** Accessible name for the table. */
  label: string;
}

export function DataTable<T>({
  columns,
  data,
  getRowId,
  isLoading,
  isFetching,
  error,
  onRetry,
  sorting,
  onSortingChange,
  columnVisibility,
  onColumnVisibilityChange,
  enableSelection,
  bulkActions,
  toolbar,
  pagination,
  emptyState,
  renderMobileRow,
  label,
}: DataTableProps<T>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const allColumns: ColumnDef<T, unknown>[] = enableSelection ? [selectionColumn<T>(), ...columns] : columns;

  const table = useReactTable({
    data: data ?? [],
    columns: allColumns,
    getRowId,
    state: { sorting, rowSelection, columnVisibility: columnVisibility ?? {} },
    onSortingChange,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    manualFiltering: true,
    enableSortingRemoval: true,
    enableMultiSort: false,
  });

  const selected = table.getSelectedRowModel().rows.map((r) => r.original);
  const clearSelection = () => setRowSelection({});
  const rows = table.getRowModel().rows;
  const visibleColumnCount = table.getVisibleLeafColumns().length;
  const empty = !isLoading && !error && rows.length === 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-8 flex-wrap items-center gap-2">
        {selected.length > 0 && bulkActions ? (
          <div className="flex w-full items-center gap-2 rounded-lg bg-primary-subtle px-2 py-1" role="region" aria-label="Bulk actions">
            <span className="px-1 text-label">{selected.length} selected</span>
            <div className="flex flex-1 items-center gap-1">{bulkActions(selected, clearSelection)}</div>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Clear selection
            </Button>
          </div>
        ) : (
          toolbar?.(table)
        )}
      </div>

      {/* Desktop table */}
      <div className="relative hidden overflow-hidden rounded-xl border md:block">
        {isFetching && !isLoading && (
          <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-primary/10" aria-hidden>
            <div className="h-full w-1/3 animate-[progress_1s_ease-in-out_infinite] bg-primary/60" />
          </div>
        )}
        <Table aria-label={label} aria-busy={isLoading || isFetching}>
          <TableHeader className="bg-muted/60">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      className="h-9 px-3 text-meta font-medium text-muted-foreground first:pl-4 last:pr-4"
                      style={{ width: header.column.columnDef.size === 150 ? undefined : header.column.columnDef.size }}
                      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  {Array.from({ length: visibleColumnCount }).map((__, j) => (
                    <TableCell key={j} className="h-12 px-3 first:pl-4 last:pr-4">
                      <Skeleton className={cn("h-3.5", j === 0 && enableSelection ? "size-4" : "w-full max-w-36")} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!!error && !isLoading && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={visibleColumnCount}>
                  <ErrorState error={error} onRetry={onRetry} />
                </TableCell>
              </TableRow>
            )}
            {empty && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={visibleColumnCount}>{emptyState}</TableCell>
              </TableRow>
            )}
            {!isLoading &&
              !error &&
              rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined} className="data-[state=selected]:bg-primary-subtle/60">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="h-12 px-3 py-1.5 first:pl-4 last:pr-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile stacked list */}
      <div className="md:hidden">
        {isLoading && (
          <div className="divide-y rounded-xl border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2 p-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        )}
        {!!error && !isLoading && <ErrorState error={error} onRetry={onRetry} className="rounded-xl border" />}
        {empty && <div className="rounded-xl border">{emptyState}</div>}
        {!isLoading && !error && rows.length > 0 && (
          <ul className="divide-y overflow-hidden rounded-xl border" aria-label={label}>
            {rows.map((row: Row<T>) => (
              <li key={row.id}>{renderMobileRow(row.original)}</li>
            ))}
          </ul>
        )}
      </div>

      <PaginationFooter {...pagination} />
    </div>
  );
}

function PaginationFooter({ pageIndex, pageSize, rowCount, hasNext, hasPrevious, onNext, onPrevious }: CursorPaginationProps) {
  if (!hasNext && !hasPrevious) {
    return rowCount > 0 ? (
      <p className="px-1 text-meta text-muted-foreground" aria-live="polite">
        {rowCount} {rowCount === 1 ? "result" : "results"}
      </p>
    ) : null;
  }
  const from = pageIndex * pageSize + 1;
  const to = pageIndex * pageSize + rowCount;
  return (
    <nav className="flex items-center justify-between gap-3 px-1" aria-label="Pagination">
      <p className="text-meta text-muted-foreground" aria-live="polite">
        Showing {from}–{to}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={onPrevious} disabled={!hasPrevious}>
          <ChevronLeft aria-hidden />
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNext}>
          Next
          <ChevronRight aria-hidden />
        </Button>
      </div>
    </nav>
  );
}

function selectionColumn<T>(): ColumnDef<T, unknown> {
  return {
    id: "__select",
    size: 36,
    enableHiding: false,
    enableSorting: false,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        aria-label="Select all rows on this page"
      />
    ),
    cell: ({ row }) => (
      <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} aria-label="Select row" />
    ),
  };
}

export function InlineSpinner() {
  return <Loader2 className="size-3.5 animate-spin text-muted-foreground" aria-hidden />;
}

"use client";

import type { Column, Table as TanstackTable } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, Columns3, ListFilter, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/** Sortable header: click cycles ascending → descending → off. */
export function SortableHeader<T>({ column, title }: { column: Column<T, unknown>; title: string }) {
  if (!column.getCanSort()) return <span>{title}</span>;
  const sorted = column.getIsSorted();
  const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ChevronsUpDown;
  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      className={cn(
        "-ml-1.5 inline-flex h-7 items-center gap-1 rounded-md px-1.5 hover:bg-accent hover:text-foreground",
        sorted && "text-foreground",
      )}
    >
      {title}
      <Icon className={cn("size-3", !sorted && "opacity-50")} aria-hidden />
    </button>
  );
}

export function TableSearch({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <InputGroup className="h-8 w-full sm:w-64">
      <InputGroupAddon>
        <Search aria-hidden />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="[&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-xs" onClick={() => onChange("")} aria-label="Clear search">
            <X />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}

export interface FilterOption {
  value: string;
  label: string;
}

/** Multi-select filter in a popover. Selections are sent to the API as repeated query params. */
export function FacetFilter({
  title,
  options,
  selected,
  onChange,
}: {
  title: string;
  options: FilterOption[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  const selectedLabels = options.filter((o) => selected.includes(o.value));
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("h-8 border-dashed font-normal", selected.length && "border-solid")}>
          <ListFilter aria-hidden />
          {title}
          {selected.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-0.5 h-3.5!" />
              {selected.length > 2 ? (
                <Badge variant="secondary" className="rounded-md px-1.5 font-normal">
                  {selected.length} selected
                </Badge>
              ) : (
                selectedLabels.map((o) => (
                  <Badge key={o.value} variant="secondary" className="rounded-md px-1.5 font-normal">
                    {o.label}
                  </Badge>
                ))
              )}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 gap-0 p-1">
        <fieldset>
          <legend className="sr-only">{title}</legend>
          {options.map((o) => {
            const id = `facet-${title}-${o.value}`;
            return (
              <label
                key={o.value}
                htmlFor={id}
                className="flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-body hover:bg-accent"
              >
                <Checkbox id={id} checked={selected.includes(o.value)} onCheckedChange={() => toggle(o.value)} />
                {o.label}
              </label>
            );
          })}
        </fieldset>
        {selected.length > 0 && (
          <>
            <Separator className="my-1" />
            <Button variant="ghost" size="sm" className="w-full justify-center" onClick={() => onChange([])}>
              Clear filter
            </Button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function ColumnVisibilityMenu<T>({ table }: { table: TanstackTable<T> }) {
  const hideable = table.getAllLeafColumns().filter((c) => c.getCanHide());
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 font-normal">
          <Columns3 aria-hidden />
          <span className="hidden sm:inline">Columns</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-meta font-normal text-muted-foreground">Show columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hideable.map((c) => (
          <DropdownMenuCheckboxItem
            key={c.id}
            checked={c.getIsVisible()}
            onCheckedChange={(v) => c.toggleVisibility(!!v)}
            onSelect={(e) => e.preventDefault()}
          >
            {(c.columnDef.meta as { label?: string } | undefined)?.label ?? c.id}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import type { ColumnDef, SortingState, VisibilityState } from "@tanstack/react-table";
import { Copy, MoreHorizontal, UserMinus, UserPlus, UserRoundCheck, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/feedback/states";
import { StatusBadge, type StatusTone } from "@/components/feedback/status-badge";
import { Page, PageHeader } from "@/components/layout/page";
import { DataTable } from "@/components/tables/data-table";
import { ColumnVisibilityMenu, FacetFilter, SortableHeader, TableSearch } from "@/components/tables/data-table-controls";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatDate, formatRelative, initials } from "@/lib/formatting";
import { useMembers, useRoles, useSetMemberStatus } from "../api";
import type { Member, MemberStatus } from "../types";
import { InviteMemberDialog } from "./invite-member-dialog";

const PAGE_SIZE = 25;

const STATUS: Record<MemberStatus, { label: string; tone: StatusTone }> = {
  active: { label: "Active", tone: "success" },
  invited: { label: "Invited", tone: "info" },
  suspended: { label: "Suspended", tone: "warning" },
};

const SORT_FIELD: Record<string, string> = {
  name: "name",
  role: "role",
  status: "status",
  last_active_at: "last_active_at",
  joined_at: "joined_at",
};

type Confirm = { members: Member[]; action: "suspend" | "reactivate" } | null;

export function PeopleScreen() {
  const { organisation, can, format } = useWorkspace();
  const canInvite = can("organisations.membership.invite");
  const canUpdate = can("organisations.membership.update");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string[]>([]);
  const [role, setRole] = useState<string[]>([]);
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({ joined_at: false });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);

  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const ordering = sorting[0] ? `${sorting[0].desc ? "-" : ""}${SORT_FIELD[sorting[0].id]}` : undefined;
  const filterKey = JSON.stringify([debouncedSearch, status, role, ordering]);
  const page = useCursorPagination(filterKey);

  const members = useMembers({
    search: debouncedSearch || undefined,
    status: status as MemberStatus[],
    role,
    ordering,
    cursor: page.cursor,
    page_size: PAGE_SIZE,
  });
  const roles = useRoles();
  const setMemberStatus = useSetMemberStatus();

  const filtered = Boolean(debouncedSearch || status.length || role.length);

  const columns = useMemo<ColumnDef<Member, unknown>[]>(
    () => [
      {
        id: "name",
        meta: { label: "Name" },
        enableHiding: false,
        header: ({ column }) => <SortableHeader column={column} title="Name" />,
        cell: ({ row }) => <PersonCell member={row.original} />,
      },
      {
        id: "role",
        meta: { label: "Role" },
        header: ({ column }) => <SortableHeader column={column} title="Role" />,
        cell: ({ row }) => <RoleCell member={row.original} />,
      },
      {
        id: "department",
        meta: { label: "Department" },
        enableSorting: false,
        header: "Department",
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.department ?? "—"}</span>,
      },
      {
        id: "status",
        meta: { label: "Status" },
        size: 120,
        header: ({ column }) => <SortableHeader column={column} title="Status" />,
        cell: ({ row }) => <StatusBadge tone={STATUS[row.original.status].tone}>{STATUS[row.original.status].label}</StatusBadge>,
      },
      {
        id: "last_active_at",
        meta: { label: "Last active" },
        size: 140,
        header: ({ column }) => <SortableHeader column={column} title="Last active" />,
        cell: ({ row }) =>
          row.original.last_active_at ? (
            <time dateTime={row.original.last_active_at} className="text-muted-foreground">
              {formatRelative(row.original.last_active_at, format)}
            </time>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "joined_at",
        meta: { label: "Joined" },
        size: 130,
        header: ({ column }) => <SortableHeader column={column} title="Joined" />,
        cell: ({ row }) =>
          row.original.joined_at ? (
            <span className="text-muted-foreground">{formatDate(row.original.joined_at, format)}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "actions",
        size: 44,
        enableHiding: false,
        enableSorting: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => <RowActions member={row.original} canUpdate={canUpdate} onConfirm={setConfirm} />,
      },
    ],
    [format, canUpdate],
  );

  const data = members.data?.results;

  return (
    <Page>
      <PageHeader
        title="People"
        description={`Everyone with access to ${organisation.name}. Their roles decide what they can see and do, and at which branches.`}
        actions={
          canInvite && (
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus aria-hidden />
              Invite people
            </Button>
          )
        }
      />

      <DataTable<Member>
        label="People"
        columns={columns}
        data={data}
        getRowId={(m) => m.id}
        isLoading={members.isPending}
        isFetching={members.isFetching}
        error={members.error}
        onRetry={() => members.refetch()}
        sorting={sorting}
        onSortingChange={setSorting}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        enableSelection={canUpdate}
        bulkActions={(rows, clear) => {
          const suspendable = rows.filter((m) => m.status === "active");
          const reactivatable = rows.filter((m) => m.status === "suspended");
          return (
            <>
              <Button
                variant="ghost"
                size="sm"
                disabled={!suspendable.length}
                onClick={() => {
                  setConfirm({ members: suspendable, action: "suspend" });
                  clear();
                }}
              >
                <UserMinus aria-hidden />
                Suspend{suspendable.length ? ` ${suspendable.length}` : ""}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={!reactivatable.length}
                onClick={() => {
                  setConfirm({ members: reactivatable, action: "reactivate" });
                  clear();
                }}
              >
                <UserRoundCheck aria-hidden />
                Reactivate{reactivatable.length ? ` ${reactivatable.length}` : ""}
              </Button>
            </>
          );
        }}
        toolbar={(table) => (
          <>
            <TableSearch value={search} onChange={setSearch} placeholder="Search by name or email" />
            <FacetFilter
              title="Status"
              options={Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label }))}
              selected={status}
              onChange={setStatus}
            />
            <FacetFilter
              title="Role"
              options={(roles.data ?? []).map((r) => ({ value: r.key, label: r.name }))}
              selected={role}
              onChange={setRole}
            />
            {filtered && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => {
                  setSearch("");
                  setStatus([]);
                  setRole([]);
                }}
              >
                Reset
              </Button>
            )}
            <div className="ml-auto hidden md:block">
              <ColumnVisibilityMenu table={table} />
            </div>
          </>
        )}
        pagination={{
          pageIndex: page.pageIndex,
          pageSize: PAGE_SIZE,
          rowCount: data?.length ?? 0,
          hasNext: Boolean(members.data?.next),
          hasPrevious: page.pageIndex > 0,
          onNext: () => page.next(members.data?.next ?? null),
          onPrevious: page.previous,
        }}
        emptyState={
          filtered ? (
            <EmptyState icon={Users} title="No matches" description="No one matches these filters. Try a different name or clear the filters." />
          ) : (
            <EmptyState
              icon={Users}
              title="No one here yet"
              description="Invite the people who work with you. You choose their role and which branches they can access."
              action={
                canInvite && (
                  <Button size="sm" onClick={() => setInviteOpen(true)}>
                    Invite people
                  </Button>
                )
              }
            />
          )
        }
        renderMobileRow={(m) => (
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <PersonCell member={m} />
              <div className="mt-1.5 flex items-center gap-2 pl-10">
                <StatusBadge tone={STATUS[m.status].tone}>{STATUS[m.status].label}</StatusBadge>
                <span className="truncate text-meta text-muted-foreground">{roleSummary(m)}</span>
              </div>
            </div>
            <RowActions member={m} canUpdate={canUpdate} onConfirm={setConfirm} />
          </div>
        )}
      />

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        {confirm && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirm.action === "suspend"
                  ? confirm.members.length === 1
                    ? `Suspend ${confirm.members[0].user.full_name}?`
                    : `Suspend ${confirm.members.length} people?`
                  : confirm.members.length === 1
                    ? `Reactivate ${confirm.members[0].user.full_name}?`
                    : `Reactivate ${confirm.members.length} people?`}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirm.action === "suspend"
                  ? `They'll be signed out of ${organisation.name} straight away and can't access it until reactivated. Their records and history are kept.`
                  : `They'll regain access with the roles they had before.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant={confirm.action === "suspend" ? "destructive" : "default"}
                onClick={() => setMemberStatus.mutate(confirm)}
              >
                {confirm.action === "suspend" ? "Suspend access" : "Reactivate"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </Page>
  );
}

function roleSummary(m: Member) {
  return m.role_assignments.map((a) => `${a.role.name} · ${a.branch?.name ?? "All branches"}`).join(", ");
}

function PersonCell({ member }: { member: Member }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar className="size-7">
        <AvatarFallback className="bg-secondary text-[11px] font-medium text-secondary-foreground">
          {initials(member.user.full_name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-body font-medium">{member.user.full_name}</p>
        <p className="truncate text-meta text-muted-foreground">{member.user.email}</p>
      </div>
    </div>
  );
}

function RoleCell({ member }: { member: Member }) {
  return (
    <div className="min-w-0">
      {member.role_assignments.map((a) => (
        <p key={a.id} className="truncate">
          {a.role.name}
          <span className="text-muted-foreground"> · {a.branch?.name ?? "All branches"}</span>
        </p>
      ))}
    </div>
  );
}

function RowActions({
  member,
  canUpdate,
  onConfirm,
}: {
  member: Member;
  canUpdate: boolean;
  onConfirm: (c: Confirm) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground" aria-label={`Actions for ${member.user.full_name}`}>
          <MoreHorizontal aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onSelect={() => {
            navigator.clipboard
              .writeText(member.user.email)
              .then(() => toast.success("Email copied"))
              .catch(() => toast.error("Couldn't copy to the clipboard"));
          }}
        >
          <Copy aria-hidden />
          Copy email
        </DropdownMenuItem>
        {canUpdate && member.status !== "invited" && (
          <>
            <DropdownMenuSeparator />
            {member.status === "active" ? (
              <DropdownMenuItem variant="destructive" onSelect={() => onConfirm({ members: [member], action: "suspend" })}>
                <UserMinus aria-hidden />
                Suspend access
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => onConfirm({ members: [member], action: "reactivate" })}>
                <UserRoundCheck aria-hidden />
                Reactivate
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

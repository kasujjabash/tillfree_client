"use client";

import { Building, EyeOff, Home, Lock, Video } from "lucide-react";
import Link from "next/link";

import { SummaryItem, SummaryStrip } from "@/components/data-display/summary-strip";
import { EmptyState, ErrorState } from "@/components/feedback/states";
import { StatusBadge, type StatusTone } from "@/components/feedback/status-badge";
import { SectionHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { formatTime } from "@/lib/formatting";
import { cn } from "@/lib/utils";
import { useHealthcareOverview } from "../api";
import type { AppointmentStatus, HealthcareOverview } from "../types";
import { AttentionList } from "./attention-list";

const STATUS: Record<AppointmentStatus, { label: string; tone: StatusTone }> = {
  scheduled: { label: "Scheduled", tone: "neutral" },
  checked_in: { label: "Checked in", tone: "info" },
  in_progress: { label: "In progress", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  no_show: { label: "No-show", tone: "warning" },
};

const SETTING = {
  home: { label: "Home visit", icon: Home },
  facility: { label: "At facility", icon: Building },
  virtual: { label: "Virtual", icon: Video },
} as const;

/**
 * Operational view for care coordinators. Patient names come from the API only
 * for members with healthcare.patient.read, and can be hidden on screen for
 * shared or public spaces. No clinical detail (diagnoses, notes, results)
 * appears on the overview.
 */
export function HealthcareOverviewPanel({ hideNames }: { hideNames: boolean }) {
  const { format, href, hasModule, can, activeBranch } = useWorkspace();
  const query = useHealthcareOverview();
  const d = query.data;
  const loading = query.isPending;

  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;

  const appts = d?.appointments_today ?? [];
  const done = appts.filter((a) => a.status === "completed").length;
  const active = appts.filter((a) => a.status !== "cancelled").length;

  return (
    <div className="flex flex-col gap-8">
      <SummaryStrip label="Today at a glance">
        {hasModule("healthcare.scheduling") && (
          <SummaryItem
            label="Appointments today"
            loading={loading}
            href={href("healthcare/appointments")}
            value={d && active}
            detail={d && `${done} completed · ${active - done} to go`}
          />
        )}
        {hasModule("healthcare.home_care") && (
          <SummaryItem
            label="Home visits, next 7 days"
            loading={loading}
            href={href("healthcare/home-care")}
            value={d?.counts.home_visits_next_7d}
          />
        )}
        {hasModule("healthcare.bedside_care") && (
          <SummaryItem
            label="Active bedside care"
            loading={loading}
            href={href("healthcare/bedside-care")}
            value={d && `${d.counts.bedside_assignments_active} assignments`}
          />
        )}
        {hasModule("healthcare.workforce") && (
          <SummaryItem
            label="Professionals on duty"
            loading={loading}
            href={href("healthcare/rota")}
            value={d && `${d.counts.professionals_on_duty} of ${d.counts.professionals_rostered_today}`}
            detail="Rostered for today"
          />
        )}
        {hasModule("healthcare.laboratory") && (
          <SummaryItem
            label="Pending lab requests"
            loading={loading}
            href={href("healthcare/laboratory")}
            value={d?.counts.lab_requests_pending}
            detail={
              d && d.counts.lab_requests_overdue > 0 ? (
                <span className="text-destructive">{d.counts.lab_requests_overdue} past expected time</span>
              ) : (
                "None overdue"
              )
            }
          />
        )}
        {hasModule("healthcare.delivery") && (
          <SummaryItem
            label="Medicine deliveries"
            loading={loading}
            href={href("healthcare/deliveries")}
            value={d && `${d.counts.deliveries_in_transit} in transit`}
            detail={d && `${d.counts.deliveries_due_today} due today`}
          />
        )}
      </SummaryStrip>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {hasModule("healthcare.scheduling") && can("healthcare.appointment.view") && (
          <section className="min-w-0 lg:col-span-7" aria-labelledby="schedule-heading">
            <SectionHeader
              id="schedule-heading"
              title="Today's schedule"
              description={d ? `${activeBranch?.name ?? "All branches"} · as of ${formatTime(d.as_of, format)}` : undefined}
              actions={
                <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                  <Link href={href("healthcare/appointments")}>Open calendar</Link>
                </Button>
              }
            />
            <Schedule rows={appts} loading={loading} hideNames={hideNames} />
          </section>
        )}
        <section className="lg:col-span-5" aria-labelledby="tasks-heading">
          <SectionHeader id="tasks-heading" title="Needs attention" description={d ? `${d.tasks.length} items` : undefined} />
          <AttentionList items={d?.tasks} loading={loading} />
        </section>
      </div>
    </div>
  );
}

function Schedule({
  rows,
  loading,
  hideNames,
}: {
  rows: HealthcareOverview["appointments_today"];
  loading: boolean;
  hideNames: boolean;
}) {
  const { format } = useWorkspace();

  if (loading) {
    return (
      <div className="divide-y rounded-xl border">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4 px-4 py-3">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    );
  }
  if (!rows.length) {
    return (
      <div className="rounded-xl border">
        <EmptyState title="No appointments today" description="Booked appointments and home visits for this branch appear here." />
      </div>
    );
  }

  return (
    <ol className="divide-y overflow-hidden rounded-xl border">
      {rows.map((a) => {
        const setting = SETTING[a.setting];
        const SettingIcon = setting.icon;
        const status = STATUS[a.status];
        const muted = a.status === "cancelled" || a.status === "completed";
        return (
          <li key={a.id} className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-start gap-x-3 px-4 py-2.5">
            <time dateTime={a.starts_at} className={cn("pt-px text-label tabular-nums", muted && "text-muted-foreground")}>
              {formatTime(a.starts_at, format)}
            </time>
            <div className="min-w-0">
              <p className={cn("truncate text-body", a.status === "cancelled" && "text-muted-foreground line-through")}>
                <PatientName patient={a.patient} hidden={hideNames} />
                <span className="text-muted-foreground"> · {a.service}</span>
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-meta text-muted-foreground">
                <SettingIcon className="size-3 shrink-0" aria-hidden />
                <span>{setting.label}</span>
                <span aria-hidden>·</span>
                <span className="truncate">{a.professional_name}</span>
              </p>
            </div>
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          </li>
        );
      })}
    </ol>
  );
}

function PatientName({ patient, hidden }: { patient: { display_name: string } | null; hidden: boolean }) {
  if (!patient) {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Lock className="size-3" aria-hidden />
        Restricted
      </span>
    );
  }
  if (hidden) {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <EyeOff className="size-3" aria-hidden />
        Patient
      </span>
    );
  }
  return <span className="font-medium">{patient.display_name}</span>;
}

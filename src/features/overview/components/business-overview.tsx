"use client";

import Link from "next/link";

import { SummaryItem, SummaryStrip } from "@/components/data-display/summary-strip";
import { ErrorState } from "@/components/feedback/states";
import { StatusDot } from "@/components/feedback/status-badge";
import { SectionHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { formatMoney, formatNumber, formatTime } from "@/lib/formatting";
import { useBusinessOverview } from "../api";
import type { BusinessOverview } from "../types";
import { AttentionList } from "./attention-list";

const PAYMENT_LABEL: Record<BusinessOverview["recent_sales"][number]["payment_method"], string> = {
  cash: "Cash",
  mobile_money: "Mobile money",
  card: "Card",
  bank_transfer: "Bank transfer",
  credit: "On account",
};

function percentChange(current: string, previous: string) {
  const p = Number(previous);
  if (!p) return null;
  return Math.round(((Number(current) - p) / p) * 100);
}

export function BusinessOverviewPanel() {
  const { format, href, can, hasModule, activeBranch } = useWorkspace();
  const query = useBusinessOverview();
  const d = query.data;
  const loading = query.isPending;

  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;

  const change = d?.sales_today.same_day_last_week ? percentChange(d.sales_today.total.amount, d.sales_today.same_day_last_week.amount) : null;
  const weekday = new Intl.DateTimeFormat(format.locale, { weekday: "long", timeZone: format.timeZone }).format(new Date());

  return (
    <div className="flex flex-col gap-8">
      <SummaryStrip label="Today at a glance">
        {hasModule("business.sales") && can("business.sale.view") && (
          <SummaryItem
            label="Sales today"
            loading={loading}
            href={href("business/sales")}
            value={d && formatMoney(d.sales_today.total, format)}
            detail={
              d && (
                <>
                  {formatNumber(d.sales_today.count, format)} sales
                  {change !== null && (
                    <>
                      {" · "}
                      <span className={change >= 0 ? "text-success" : "text-destructive"}>
                        {change >= 0 ? "+" : "−"}
                        {Math.abs(change)}%
                      </span>{" "}
                      vs last {weekday}
                    </>
                  )}
                </>
              )
            }
          />
        )}
        {hasModule("business.invoicing") && can("business.invoice.view") && (
          <SummaryItem
            label="Outstanding invoices"
            loading={loading}
            href={href("business/invoices")}
            value={d && formatMoney(d.receivables.outstanding, format)}
            detail={
              d && (
                <>
                  {d.receivables.open_count} open
                  {d.receivables.overdue_count > 0 && (
                    <>
                      {" · "}
                      <span className="text-destructive">
                        {d.receivables.overdue_count} overdue ({formatMoney(d.receivables.overdue, format, { compact: true })})
                      </span>
                    </>
                  )}
                </>
              )
            }
          />
        )}
        {hasModule("business.inventory") && can("inventory.stock.view") && (
          <>
            <SummaryItem
              label="Stock alerts"
              loading={loading}
              href={href("business/inventory")}
              value={d && `${d.stock.low_stock_count + d.stock.out_of_stock_count} products`}
              detail={
                d && (
                  <>
                    {d.stock.low_stock_count} low
                    {d.stock.out_of_stock_count > 0 && (
                      <>
                        {" · "}
                        <span className="text-destructive">{d.stock.out_of_stock_count} out of stock</span>
                      </>
                    )}
                  </>
                )
              }
            />
            <SummaryItem
              label="Expiring within 30 days"
              loading={loading}
              href={href("business/inventory")}
              value={d && `${d.stock.expiring_30d_count} batches`}
              detail="Sell first or write off"
            />
          </>
        )}
      </SummaryStrip>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <section className="lg:col-span-5" aria-labelledby="attention-heading">
          <SectionHeader
            id="attention-heading"
            title="Needs attention"
            description={d ? `${d.attention.length} items${activeBranch ? ` at ${activeBranch.name}` : ""}` : undefined}
          />
          <AttentionList items={d?.attention} loading={loading} />
        </section>

        {hasModule("business.sales") && can("business.sale.view") && (
          <section className="min-w-0 lg:col-span-7" aria-labelledby="recent-sales-heading">
            <SectionHeader
              id="recent-sales-heading"
              title="Recent sales"
              description={d ? `As of ${formatTime(d.as_of, format)}` : undefined}
              actions={
                <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                  <Link href={href("business/sales")}>View all</Link>
                </Button>
              }
            />
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-9 pl-4 text-meta">Receipt</TableHead>
                    <TableHead className="hidden h-9 text-meta sm:table-cell">Branch</TableHead>
                    <TableHead className="hidden h-9 text-meta md:table-cell">Payment</TableHead>
                    <TableHead className="h-9 text-meta">Time</TableHead>
                    <TableHead className="h-9 pr-4 text-right text-meta">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading &&
                    [0, 1, 2, 3, 4].map((i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={5} className="px-4">
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      </TableRow>
                    ))}
                  {d?.recent_sales.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="py-2 pl-4 font-mono text-[12.5px]">{s.reference}</TableCell>
                      <TableCell className="hidden py-2 text-muted-foreground sm:table-cell">{s.branch_name}</TableCell>
                      <TableCell className="hidden py-2 text-muted-foreground md:table-cell">{PAYMENT_LABEL[s.payment_method]}</TableCell>
                      <TableCell className="py-2 text-muted-foreground">{formatTime(s.occurred_at, format)}</TableCell>
                      <TableCell className="py-2 pr-4 text-right">
                        {s.status === "refunded" ? (
                          <span className="inline-flex items-center gap-2">
                            <StatusDot tone="warning">
                              <span className="text-meta text-muted-foreground">Refunded</span>
                            </StatusDot>
                            <span className="text-muted-foreground line-through">{formatMoney(s.total, format)}</span>
                          </span>
                        ) : (
                          formatMoney(s.total, format)
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

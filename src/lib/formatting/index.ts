import type { Money } from "@/types/api";

/**
 * Display formatting. The API returns raw values; the client formats them with
 * the organisation's locale and the branch/organisation/user timezone. No
 * country is assumed anywhere in this file.
 */

export interface FormatContext {
  locale: string; // BCP 47, e.g. "en-UG", "sw-KE"
  timeZone: string; // IANA, e.g. "Africa/Kampala"
}

const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat | Intl.RelativeTimeFormat>();

function memo<T extends Intl.NumberFormat | Intl.DateTimeFormat | Intl.RelativeTimeFormat>(
  key: string,
  create: () => T,
): T {
  let f = cache.get(key) as T | undefined;
  if (!f) {
    f = create();
    cache.set(key, f);
  }
  return f;
}

/**
 * Formats a money value without converting it. The amount stays a decimal
 * string all the way to Intl (NumberFormat v3 accepts strings exactly), so
 * large values keep their precision. Minor units come from the currency.
 */
export function formatMoney(money: Money, ctx: Pick<FormatContext, "locale">, opts?: { compact?: boolean }) {
  const f = memo(`money|${ctx.locale}|${money.currency}|${opts?.compact ?? false}`, () =>
    new Intl.NumberFormat(ctx.locale, {
      style: "currency",
      currency: money.currency,
      currencyDisplay: "code",
      notation: opts?.compact ? "compact" : "standard",
    }),
  );
  return f.format(money.amount as Intl.StringNumericLiteral);
}

export function formatNumber(value: number | string, ctx: Pick<FormatContext, "locale">) {
  return memo(`num|${ctx.locale}`, () => new Intl.NumberFormat(ctx.locale)).format(
    value as Intl.StringNumericLiteral,
  );
}

export function formatDate(iso: string, ctx: FormatContext, style: "medium" | "short" = "medium") {
  // Plain calendar dates ("YYYY-MM-DD") are not instants; format them in UTC so they never shift a day.
  const isCalendarDate = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const tz = isCalendarDate ? "UTC" : ctx.timeZone;
  return memo(`date|${ctx.locale}|${tz}|${style}`, () =>
    new Intl.DateTimeFormat(ctx.locale, { dateStyle: style, timeZone: tz }),
  ).format(new Date(isCalendarDate ? `${iso}T00:00:00Z` : iso));
}

export function formatTime(iso: string, ctx: FormatContext) {
  return memo(`time|${ctx.locale}|${ctx.timeZone}`, () =>
    new Intl.DateTimeFormat(ctx.locale, { timeStyle: "short", timeZone: ctx.timeZone }),
  ).format(new Date(iso));
}

export function formatDateTime(iso: string, ctx: FormatContext) {
  return memo(`dt|${ctx.locale}|${ctx.timeZone}`, () =>
    new Intl.DateTimeFormat(ctx.locale, { dateStyle: "medium", timeStyle: "short", timeZone: ctx.timeZone }),
  ).format(new Date(iso));
}

const RELATIVE_STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["second", 60],
  ["minute", 60],
  ["hour", 24],
  ["day", 7],
  ["week", 4.345],
  ["month", 12],
  ["year", Infinity],
];

export function formatRelative(iso: string, ctx: Pick<FormatContext, "locale">, now = Date.now()) {
  let delta = (new Date(iso).getTime() - now) / 1000;
  const rtf = memo(`rel|${ctx.locale}`, () => new Intl.RelativeTimeFormat(ctx.locale, { numeric: "auto" }));
  for (const [unit, size] of RELATIVE_STEPS) {
    if (Math.abs(delta) < size) return rtf.format(Math.round(delta), unit);
    delta /= size;
  }
  return rtf.format(Math.round(delta), "year");
}

/** "Amina Nakato" -> "AN". Used for avatars; never for identifying patients. */
export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return ((parts[0][0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

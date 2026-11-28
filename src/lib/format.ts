import { fromIso } from './dates'
import { LOCALES, type Lang } from './i18n'

type RangeFormatter = Intl.DateTimeFormat & { formatRange?: (start: Date, end: Date) => string }

/** Indicative demo conversion using the 2025-01-02 FRED DEXUSUK observation. */
export function formatMoney(amount: number, currency: 'GBP'|'USD'='GBP'):string {
  const estimate = currency === 'USD'
  const whole = Math.round(amount * (estimate ? 1.2376 : 1))
  return (estimate ? "≈ $" : "£") + whole.toLocaleString('en-GB')
}

export function formatNumber(lang: Lang, value: number): string {
  return new Intl.NumberFormat(LOCALES[lang]).format(value)
}

export function formatDate(lang: Lang, iso: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(LOCALES[lang], options).format(fromIso(iso))
}

export function formatDateRange(
  lang: Lang,
  startIso: string,
  endIso: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' },
): string {
  const formatter = new Intl.DateTimeFormat(LOCALES[lang], options) as RangeFormatter
  const start = fromIso(startIso)
  const end = fromIso(endIso)
  return formatter.formatRange ? formatter.formatRange(start, end) : `${formatter.format(start)} – ${formatter.format(end)}`
}

export function formatClock(lang: Lang, date: Date): string {
  return new Intl.DateTimeFormat(LOCALES[lang], { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date)
}

export function formatDuration(lang: Lang, minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = String(minutes % 60).padStart(2, '0')
  return lang === 'ar' ? `${hours} س ${mins} د` : `${hours}h ${mins}m`
}

export function formatRelative(lang: Lang, date: Date, nowLabel: string): string {
  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 60) return nowLabel
  const rtf = new Intl.RelativeTimeFormat(LOCALES[lang], { numeric: 'auto' })
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute')
  if (abs < 86_400) return rtf.format(Math.round(seconds / 3600), 'hour')
  return rtf.format(Math.round(seconds / 86_400), 'day')
}

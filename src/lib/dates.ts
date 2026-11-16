/** Date helpers. Dates travel through the app as local ISO strings (YYYY-MM-DD). */

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export const TODAY = startOfDay(new Date())

export function toIso(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fromIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso: string, days: number): string {
  const date = fromIso(iso)
  date.setDate(date.getDate() + days)
  return toIso(date)
}

export const TODAY_ISO = toIso(TODAY)

/** ISO date relative to today. */
export function fromToday(days: number): string {
  return addDays(TODAY_ISO, days)
}

export function daysBetween(fromIsoDate: string, toIsoDate: string): number {
  return Math.round((fromIso(toIsoDate).getTime() - fromIso(fromIsoDate).getTime()) / 86_400_000)
}

/** A Date `minutesAgo` minutes before now, for timestamps in demo content. */
export function minutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60_000)
}

/** Parses "HH:MM" into minutes after midnight. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** Formats minutes after midnight (wrapping past midnight) as "HH:MM". */
export function minutesToTime(total: number): string {
  const wrapped = ((total % 1440) + 1440) % 1440
  const h = Math.floor(wrapped / 60)
  const m = wrapped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

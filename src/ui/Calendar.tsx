import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { fromIso, toIso, TODAY_ISO } from '@/lib/dates'
import { LOCALES } from '@/lib/i18n'
import { useI18n } from '@/state/store'
import { IconButton } from './Button'
import { FLIP_RTL } from './motion'

type CalendarProps = {
  mode: 'single' | 'range'
  start?: string
  end?: string
  min?: string
  onChange: (start: string, end?: string) => void
}

function monthStart(iso: string): Date {
  const date = fromIso(iso)
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function Calendar({ mode, start, end, min = TODAY_ISO, onChange }: CalendarProps) {
  const { lang, date, num, t } = useI18n()
  const [month, setMonth] = useState(() => monthStart(start ?? min))

  const weekdays = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(LOCALES[lang], { weekday: 'narrow' })
    // 1 January 2024 was a Monday; weeks start on Monday, as in the UK.
    return Array.from({ length: 7 }, (_, i) => formatter.format(new Date(2024, 0, 1 + i)))
  }, [lang])

  const cells = useMemo(() => {
    const offset = (month.getDay() + 6) % 7
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    return [
      ...Array.from({ length: offset }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => toIso(new Date(month.getFullYear(), month.getMonth(), i + 1))),
    ]
  }, [month])

  const monthLabel = new Intl.DateTimeFormat(LOCALES[lang], { month: 'long', year: 'numeric' }).format(month)
  const canGoBack = month > monthStart(min)

  const select = (iso: string) => {
    if (mode === 'single') return onChange(iso)
    if (!start || end || iso <= start) return onChange(iso, undefined)
    onChange(start, iso)
  }

  const shiftMonth = (delta: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1))

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <IconButton label={t('calendar.prev')} size="sm" disabled={!canGoBack} onClick={() => shiftMonth(-1)} className="disabled:opacity-30">
          <ChevronLeft className={FLIP_RTL} />
        </IconButton>
        <p className="text-[15px] font-semibold" aria-live="polite">
          {monthLabel}
        </p>
        <IconButton label={t('calendar.next')} size="sm" onClick={() => shiftMonth(1)}>
          <ChevronRight className={FLIP_RTL} />
        </IconButton>
      </div>
      <div className="grid grid-cols-7 pb-1" aria-hidden>
        {weekdays.map((weekday, i) => (
          <span key={i} className="text-center text-[11.5px] font-semibold uppercase text-fg-subtle">
            {weekday}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((iso, i) => {
          if (!iso) return <span key={`blank-${i}`} />
          const isStart = iso === start
          const isEnd = iso === end
          const inRange = !!start && !!end && iso > start && iso < end
          const disabled = iso < min
          return (
            <div key={iso} className="relative h-11">
              {inRange && <span aria-hidden className="absolute inset-0 bg-brand-orange/14" />}
              {isStart && end && <span aria-hidden className="absolute inset-y-0 end-0 w-1/2 bg-brand-orange/14" />}
              {isEnd && start && <span aria-hidden className="absolute inset-y-0 start-0 w-1/2 bg-brand-orange/14" />}
              <button
                type="button"
                disabled={disabled}
                aria-pressed={isStart || isEnd}
                aria-label={date(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                onClick={() => select(iso)}
                className={cn(
                  'relative mx-auto grid size-11 place-items-center rounded-full text-[14px] tabular-nums transition-colors',
                  isStart || isEnd
                    ? 'bg-brand-orange font-semibold text-ink-950'
                    : disabled
                      ? 'text-fg-subtle/35'
                      : 'text-fg hover:bg-white/[0.07]',
                )}
              >
                {num(fromIso(iso).getDate())}
                {iso === TODAY_ISO && !isStart && !isEnd && (
                  <span aria-hidden className="absolute bottom-1.5 size-1 rounded-full bg-brand-orange" />
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

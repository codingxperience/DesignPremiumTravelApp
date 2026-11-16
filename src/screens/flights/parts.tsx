import { useEffect, useMemo, useState } from 'react'
import { Check, Luggage, Plane, Search } from 'lucide-react'
import { AIRPORTS, getAirport } from '@/data/airports'
import type { Cabin, Flight } from '@/data/types'
import { cn } from '@/lib/cn'
import type { TKey } from '@/lib/i18n'
import { useI18n } from '@/state/store'
import { Button } from '@/ui/Button'
import { Calendar } from '@/ui/Calendar'
import { Chip, Stepper } from '@/ui/Controls'
import { AirlineBadge } from '@/ui/Icons'
import { Badge, Perforation } from '@/ui/Misc'
import { Sheet } from '@/ui/Overlay'

export const CABINS: Cabin[] = ['economy', 'premium', 'business', 'first']
export const cabinKey = (cabin: Cabin) => `flights.cabin.${cabin}` as TKey

/** A dashed flight path with the aircraft at its midpoint. */
function FlightPath({ label, sub, subTone }: { label: string; sub: string; subTone: 'direct' | 'stop' }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center px-2">
      <span className="text-[11.5px] text-fg-subtle">{label}</span>
      <div className="relative my-1.5 flex w-full items-center">
        <span className="size-1.5 shrink-0 rounded-full border border-fg-subtle" />
        <span className="h-px flex-1 border-t border-dashed border-white/25" />
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink-700 text-orange-300">
          <Plane className={cn('size-3.5 rotate-45', 'rtl:-rotate-[135deg]')} />
        </span>
        <span className="h-px flex-1 border-t border-dashed border-white/25" />
        <span className="size-1.5 shrink-0 rounded-full bg-fg-subtle" />
      </div>
      <span className={cn('text-[11.5px] font-semibold', subTone === 'direct' ? 'text-success' : 'text-warning')}>{sub}</span>
    </div>
  )
}

export function FlightCard({
  flight,
  price,
  priceNote,
  cabin,
  tags,
  onSelect,
}: {
  flight: Flight
  price: number
  priceNote: string
  cabin: Cabin
  tags?: string[]
  onSelect: () => void
}) {
  const { t, tp, L, money, duration } = useI18n()
  return (
    <button
      type="button"
      onClick={onSelect}
      className="block w-full rounded-[24px] border border-white/[0.07] bg-white/[0.035] text-start shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors hover:bg-white/[0.055]"
    >
      <div className="flex items-center gap-3 px-4 pt-4">
        <AirlineBadge airline={flight.airline} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold">{L(flight.airline.name)}</p>
          <p className="text-[12px] text-fg-subtle" dir="ltr">
            {flight.number}
          </p>
        </div>
        <div className="text-end">
          <p className="text-[20px] font-semibold tabular-nums">{money(price)}</p>
          <p className="text-[11.5px] text-fg-subtle">{priceNote}</p>
        </div>
      </div>
      <div className="flex items-center px-4 pt-4">
        <div>
          <p className="text-[22px] font-semibold tabular-nums leading-none">{flight.dep}</p>
          <p className="mt-1.5 text-[12.5px] font-medium text-fg-muted">{flight.from}</p>
        </div>
        <FlightPath
          label={duration(flight.durationMin)}
          sub={flight.stops === 0 ? t('common.direct') : `${tp('common.stops', flight.stops)} · ${flight.via}`}
          subTone={flight.stops === 0 ? 'direct' : 'stop'}
        />
        <div className="text-end">
          <p className="text-[22px] font-semibold tabular-nums leading-none">
            {flight.arr}
            {flight.dayOffset > 0 && <sup className="ms-0.5 text-[11px] text-orange-300">+{flight.dayOffset}</sup>}
          </p>
          <p className="mt-1.5 text-[12.5px] font-medium text-fg-muted">{flight.to}</p>
        </div>
      </div>
      <Perforation className="mt-3" />
      <div className="flex items-center gap-2 px-4 pb-4">
        <span className="flex items-center gap-1.5 text-[12px] text-fg-muted">
          <Luggage className="size-4" />
          {t('fare.checkedBag')}
        </span>
        <span className="text-fg-subtle">·</span>
        <span className="text-[12px] text-fg-muted">{t(cabinKey(cabin))}</span>
        <span className="ms-auto flex gap-1.5">
          {tags?.map((tag) => (
            <Badge key={tag} tone="orange">
              {tag}
            </Badge>
          ))}
        </span>
      </div>
    </button>
  )
}

/** Vertical timeline for one flight segment, from departure to arrival. */
export function SegmentTimeline({ flight, label }: { flight: Flight; label: string }) {
  const { t, tp, L, date, duration } = useI18n()
  const from = getAirport(flight.from)
  const to = getAirport(flight.to)
  return (
    <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.035] p-4">
      <div className="flex items-center justify-between gap-3">
        <Badge tone="sky">{label}</Badge>
        <span className="text-[12.5px] text-fg-muted">{date(flight.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
      </div>
      <div className="mt-4 grid grid-cols-[52px_20px_1fr] gap-x-3">
        <p className="text-[17px] font-semibold tabular-nums">{flight.dep}</p>
        <div className="flex flex-col items-center pt-1.5">
          <span className="size-2.5 rounded-full border-2 border-brand-orange" />
          <span className="my-1 w-px flex-1 border-s border-dashed border-white/20" />
        </div>
        <div className="pb-5">
          <p className="text-[15px] font-semibold">
            {L(from.city)} <span className="text-fg-subtle">({from.code})</span>
          </p>
          <p className="mt-0.5 text-[12.5px] text-fg-muted">
            {L(from.name)} · {t('flights.terminal', { t: flight.depTerminal })}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-white/[0.04] px-3 py-2.5 text-[12px] text-fg-muted">
            <span className="flex items-center gap-1.5">
              <AirlineBadge airline={flight.airline} className="size-5 rounded-[6px] text-[8px]" />
              <span dir="ltr">{flight.number}</span>
            </span>
            <span>{duration(flight.durationMin)}</span>
            <span>{flight.stops === 0 ? t('common.direct') : `${tp('common.stops', flight.stops)} · ${t('flights.via', { code: flight.via ?? '' })}`}</span>
            <span>{flight.aircraft}</span>
          </div>
        </div>
        <p className="text-[17px] font-semibold tabular-nums">
          {flight.arr}
          {flight.dayOffset > 0 && <sup className="ms-0.5 text-[10px] text-orange-300">+{flight.dayOffset}</sup>}
        </p>
        <div className="flex justify-center pt-1.5">
          <span className="size-2.5 rounded-full bg-brand-orange" />
        </div>
        <div>
          <p className="text-[15px] font-semibold">
            {L(to.city)} <span className="text-fg-subtle">({to.code})</span>
          </p>
          <p className="mt-0.5 text-[12.5px] text-fg-muted">
            {L(to.name)} · {t('flights.terminal', { t: flight.arrTerminal })}
          </p>
        </div>
      </div>
    </div>
  )
}

export function AirportSheet({
  open,
  onClose,
  title,
  selected,
  exclude,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  title: string
  selected: string
  exclude?: string
  onSelect: (code: string) => void
}) {
  const { t, L } = useI18n()
  const [query, setQuery] = useState('')
  const normalized = query.trim().toLowerCase()
  const matches = useMemo(
    () =>
      AIRPORTS.filter((a) => a.code !== exclude).filter(
        (a) => !normalized || [a.code, a.city.en, a.name.en].some((s) => s.toLowerCase().includes(normalized)) || [a.city.ar, a.name.ar].some((s) => s.includes(query.trim())),
      ),
    [exclude, normalized, query],
  )
  const groups = [
    { title: t('flights.ukAirports'), items: matches.filter((a) => a.uk) },
    { title: t('flights.destinations'), items: matches.filter((a) => !a.uk) },
  ].filter((group) => group.items.length)

  return (
    <Sheet open={open} onClose={onClose} title={title} label={title}>
      <div className="flex h-12 items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.05] px-3.5 focus-within:border-brand-orange/70">
        <Search className="size-5 text-fg-subtle" aria-hidden />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('flights.searchAirport')}
          aria-label={t('flights.searchAirport')}
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-fg-subtle focus-visible:outline-none"
        />
      </div>
      {groups.length === 0 && <p className="py-10 text-center text-[14px] text-fg-muted">{t('flights.noAirports')}</p>}
      {groups.map((group) => (
        <div key={group.title} className="mt-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-fg-subtle">{group.title}</p>
          <ul className="mt-1">
            {group.items.map((airport) => (
              <li key={airport.code}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(airport.code)
                    onClose()
                  }}
                  className="flex w-full items-center gap-3.5 rounded-2xl py-3 text-start"
                >
                  <span className="grid h-10 w-12 shrink-0 place-items-center rounded-[12px] bg-white/[0.06] text-[13px] font-bold tracking-[0.04em]">{airport.code}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold">{L(airport.city)}</span>
                    <span className="block truncate text-[12.5px] text-fg-muted">{L(airport.name)}</span>
                  </span>
                  {airport.code === selected && <Check className="size-5 text-brand-orange" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </Sheet>
  )
}

export function DatesSheet({
  open,
  onClose,
  mode,
  start,
  end,
  onApply,
}: {
  open: boolean
  onClose: () => void
  mode: 'single' | 'range'
  start: string
  end?: string
  onApply: (start: string, end?: string) => void
}) {
  const { t, date } = useI18n()
  const [draft, setDraft] = useState<{ start: string; end?: string }>({ start, end })
  useEffect(() => {
    if (open) setDraft({ start, end })
  }, [open, start, end])
  const fmt = (iso?: string) => (iso ? date(iso, { weekday: 'short', day: 'numeric', month: 'short' }) : '—')
  const ready = mode === 'single' || !!draft.end

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={mode === 'single' ? t('flights.selectDate') : t('flights.selectDates')}
      label={t('flights.selectDates')}
      footer={
        <div className="flex items-center gap-4">
          <p className="min-w-0 flex-1 truncate text-[14px] font-semibold">
            {fmt(draft.start)}
            {mode === 'range' && <span className="text-fg-subtle"> → {fmt(draft.end)}</span>}
          </p>
          <Button
            size="md"
            disabled={!ready}
            onClick={() => {
              onApply(draft.start, draft.end)
              onClose()
            }}
          >
            {t('common.apply')}
          </Button>
        </div>
      }
    >
      <Calendar mode={mode} start={draft.start} end={draft.end} onChange={(s, e) => setDraft({ start: s, end: e })} />
    </Sheet>
  )
}

export function PassengersSheet({
  open,
  onClose,
  value,
  onApply,
}: {
  open: boolean
  onClose: () => void
  value: { adults: number; children: number; infants: number; cabin: Cabin }
  onApply: (value: { adults: number; children: number; infants: number; cabin: Cabin }) => void
}) {
  const { t } = useI18n()
  const [draft, setDraft] = useState(value)
  const { adults, children, infants, cabin } = value
  useEffect(() => {
    // Depend on primitives: the parent passes a fresh object on every render.
    if (open) setDraft({ adults, children, infants, cabin })
  }, [open, adults, children, infants, cabin])
  const rows: { key: 'adults' | 'children' | 'infants'; label: TKey; hint: TKey; min: number }[] = [
    { key: 'adults', label: 'flights.adults', hint: 'flights.adultsHint', min: 1 },
    { key: 'children', label: 'flights.children', hint: 'flights.childrenHint', min: 0 },
    { key: 'infants', label: 'flights.infants', hint: 'flights.infantsHint', min: 0 },
  ]
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('flights.passengers')}
      label={t('flights.passengers')}
      footer={
        <Button
          block
          onClick={() => {
            onApply(draft)
            onClose()
          }}
        >
          {t('common.done')}
        </Button>
      }
    >
      <ul className="divide-y divide-white/[0.06]">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center justify-between py-4">
            <div>
              <p className="text-[15px] font-semibold">{t(row.label)}</p>
              <p className="text-[12.5px] text-fg-subtle">{t(row.hint)}</p>
            </div>
            <Stepper
              label={t(row.label)}
              value={draft[row.key]}
              min={row.min}
              max={row.key === 'infants' ? draft.adults : 8}
              onChange={(next) =>
                setDraft((current) => {
                  const updated = { ...current, [row.key]: next }
                  // Each infant travels on an adult's lap, so infants never outnumber adults.
                  return { ...updated, infants: Math.min(updated.infants, updated.adults) }
                })
              }
            />
          </li>
        ))}
      </ul>
      <p className="mt-5 text-[13px] font-semibold text-fg-muted">{t('flights.cabin')}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {CABINS.map((cabin) => (
          <Chip key={cabin} selected={draft.cabin === cabin} onClick={() => setDraft({ ...draft, cabin })}>
            {t(cabinKey(cabin))}
          </Chip>
        ))}
      </div>
    </Sheet>
  )
}

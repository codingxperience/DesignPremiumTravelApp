import { useMemo } from 'react'
import { Plane } from 'lucide-react'
import { LogoMark } from '@/brand/Logo'
import { getAirport } from '@/data/airports'
import { USER } from '@/data/demo'
import type { Booking } from '@/data/types'
import { cn } from '@/lib/cn'
import { useI18n } from '@/state/store'
import { Perforation } from '@/ui/Misc'
import { cabinKey } from '../flights/parts'

/** Deterministic barcode bars derived from the booking reference. */
function Barcode({ value, label }: { value: string; label: string }) {
  const bars = useMemo(() => {
    const widths: number[] = []
    for (const char of `${value}${USER.name}`) {
      const code = char.charCodeAt(0)
      widths.push((code % 3) + 1, ((code >> 2) % 2) + 1, ((code >> 1) % 3) + 1)
    }
    return widths
  }, [value])
  return (
    <div role="img" aria-label={label} className="flex h-14 items-stretch justify-center gap-[2px] overflow-hidden" dir="ltr">
      {bars.map((width, i) => (
        <span key={i} className={i % 2 ? 'bg-transparent' : 'bg-ink-950'} style={{ width }} />
      ))}
    </div>
  )
}

function Field({ label, value, align = 'start', className }: { label: string; value: string; align?: 'start' | 'end'; className?: string }) {
  return (
    <div className={cn(align === 'end' && 'text-end', className)}>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-950/45">{label}</p>
      <p className="mt-1 text-[14px] font-bold text-ink-950">{value}</p>
    </div>
  )
}

export function BoardingPass({ booking, segment = 'outbound' }: { booking: Booking; segment?: 'outbound' | 'inbound' }) {
  const { t, L, date } = useI18n()
  const selection = booking.flight!
  const flight = segment === 'inbound' && selection.inbound ? selection.inbound : selection.outbound
  const from = getAirport(flight.from)
  const to = getAirport(flight.to)
  const seat = segment === 'outbound' ? (selection.seat ?? '—') : '—'

  return (
    <article className="overflow-hidden rounded-[26px] bg-white text-ink-950 shadow-[0_34px_60px_-30px_rgba(0,0,0,0.95)]" aria-label={t('ticket.title')}>
      <header className="flex items-center justify-between bg-brand-blue px-5 py-3.5 text-white">
        <LogoMark className="h-[22px] w-auto" title={t('brand.full')} />
        <span className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.18em]">
          <Plane className="size-4 rotate-45 rtl:-rotate-[135deg]" aria-hidden />
          {t('ticket.label')}
        </span>
      </header>
      <div className="px-5 pt-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-950/45">{t('ticket.from')}</p>
            <p className="heading mt-1 text-[30px] leading-none text-brand-blue">{from.code}</p>
            <p className="mt-1.5 text-[12.5px] font-semibold text-ink-950/70">{L(from.city)}</p>
          </div>
          <div className="flex flex-1 items-center gap-1.5 pt-6" aria-hidden>
            <span className="h-px flex-1 border-t border-dashed border-ink-950/25" />
            <span className="grid size-8 place-items-center rounded-full bg-brand-orange text-white">
              <Plane className="size-4 rotate-45 rtl:-rotate-[135deg]" />
            </span>
            <span className="h-px flex-1 border-t border-dashed border-ink-950/25" />
          </div>
          <div className="text-end">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-950/45">{t('ticket.to')}</p>
            <p className="heading mt-1 text-[30px] leading-none text-brand-blue">{to.code}</p>
            <p className="mt-1.5 text-[12.5px] font-semibold text-ink-950/70">{L(to.city)}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <Field label={t('ticket.flight')} value={flight.number} />
          <Field label={t('ticket.date')} value={date(flight.date, { day: '2-digit', month: 'short', year: 'numeric' })} />
          <Field label={t('ticket.class')} value={t(cabinKey(selection.cabin))} align="end" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label={t('ticket.departure')} value={`${flight.dep} · ${t('flights.terminal', { t: flight.depTerminal })}`} />
          <Field label={t('ticket.arrival')} value={`${flight.arr} · ${t('flights.terminal', { t: flight.arrTerminal })}`} align="end" />
        </div>
      </div>
      <Perforation notchClassName="bg-ink-900" className="mt-5 [&>div:first-child]:border-ink-950/20" />
      <div className="px-5 pb-5 pt-1">
        <div className="flex items-end justify-between gap-3">
          <Field label={t('ticket.passenger')} value={USER.name.toUpperCase()} />
          <Field label={t('ticket.seat')} value={seat} align="end" />
        </div>
        <div className="mt-4">
          <Barcode value={booking.ref} label={t('ticket.barcode', { ref: booking.ref })} />
          <p className="mt-2 text-center text-[11px] font-semibold tracking-[0.3em] text-ink-950/60" dir="ltr">
            {booking.ref}
          </p>
        </div>
      </div>
    </article>
  )
}

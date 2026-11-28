import { useState, type ReactNode } from 'react'
import { ArrowRight, BadgeCheck, CalendarDays, Star } from 'lucide-react'
import { getDestination } from '@/data/destinations'
import { getHotel, HOTEL_OPTIONS } from '@/data/hotels'
import { getPackage } from '@/data/packages'
import {
  HOTEL_EXTRA_PRICES,
  hotelQuote,
  makeHotelDraft,
  makePackageDraft,
  PACKAGE_EXTRA_PRICES,
  packageQuote,
  sumLines,
  type HotelExtras,
  type PackageExtras,
} from '@/data/quotes'
import type { PriceLine } from '@/data/types'
import { cn } from '@/lib/cn'
import { addDays, daysBetween, fromToday } from '@/lib/dates'
import type { TKey } from '@/lib/i18n'
import type { BookableItem } from '@/state/routes'
import { useI18n, useNav } from '@/state/store'
import { Button } from '@/ui/Button'
import { Chip, Stepper, Switch } from '@/ui/Controls'
import { PickerField } from '@/ui/Field'
import { Img } from '@/ui/Img'
import { Card, RollingValue } from '@/ui/Misc'
import { FLIP_RTL } from '@/ui/motion'
import { Screen, ScreenHeader, StickyFooter } from '@/ui/Screen'
import { DatesSheet } from '../flights/parts'

function Section({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn('mt-7', className)}>
      <h2 className="mb-3 text-[15px] font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function SummaryCard({ image, title, subtitle, meta }: { image: string; title: string; subtitle: string; meta: ReactNode }) {
  return (
    <Card className="flex items-center gap-3.5 p-3">
      <span className="block size-[76px] shrink-0 overflow-hidden rounded-[18px] bg-ink-700">
        <Img id={image} alt="" width={76} height={76} className="size-full" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[15.5px] font-semibold leading-snug">{title}</p>
        <p className="mt-0.5 truncate text-[12.5px] text-fg-muted">{subtitle}</p>
        <div className="mt-1.5 text-[12px] text-fg-subtle">{meta}</div>
      </div>
    </Card>
  )
}

function ExtraRow({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-[14.5px] font-medium">{label}</p>
        <p className="text-[12px] text-fg-subtle">{hint}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  )
}

export function Breakdown({ lines, total }: { lines: PriceLine[]; total: number }) {
  const { t, L, money } = useI18n()
  return (
    <Card className="p-4">
      <ul className="space-y-2.5">
        {lines.map((line) => (
          <li key={line.label.en} className="flex items-start justify-between gap-4 text-[13.5px]">
            <span className="text-fg-muted">{L(line.label)}</span>
            <span className={cn('shrink-0 font-medium tabular-nums', line.amount < 0 && 'text-success')}>
              {line.amount < 0 ? `−${money(-line.amount)}` : money(line.amount)}
            </span>
          </li>
        ))}
        <li className="flex items-start justify-between gap-4 text-[13.5px]">
          <span className="text-fg-muted">{t('pay.taxes')}</span>
          <span className="shrink-0 font-medium text-success">{t('common.included')}</span>
        </li>
      </ul>
      <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-4">
        <span className="text-[15px] font-semibold">{t('common.total')}</span>
        <RollingValue value={money(total)} className="text-[20px] font-semibold" />
      </div>
    </Card>
  )
}

function BookingFooter({ total, onContinue }: { total: number; onContinue: () => void }) {
  const { t, money } = useI18n()
  return (
    <StickyFooter className="flex items-center justify-between gap-4">
      <div>
        <p className="text-[12px] text-fg-subtle">{t('common.total')}</p>
        <RollingValue value={money(total)} className="text-[22px] font-semibold" />
      </div>
      <Button onClick={onContinue} className="min-w-[170px]" iconEnd={<ArrowRight className={cn('size-5', FLIP_RTL)} />}>
        {t('booking.toPayment')}
      </Button>
    </StickyFooter>
  )
}

function PackageBooking({ packageId }: { packageId: string }) {
  const { t, tp, L, money, date } = useI18n()
  const { push } = useNav()
  const travelPackage = getPackage(packageId)
  const destination = getDestination(travelPackage.destinationId)
  const fixed = travelPackage.fixedDates
  const [start, setStart] = useState(fixed?.start ?? fromToday(30))
  const end = fixed?.end ?? addDays(start, travelPackage.nights)
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [optionId, setOptionId] = useState(travelPackage.options[0].id)
  const [extras, setExtras] = useState<PackageExtras>({ insurance: true, lounge: false, visa: false })
  const [datesOpen, setDatesOpen] = useState(false)

  const lines = packageQuote(travelPackage, { adults, children, optionId, extras })
  const total = sumLines(lines)
  const travellers = adults + children
  const visaIncluded = travelPackage.includes.includes('visa')
  const fmt = (iso: string) => date(iso, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  const extraRows: { key: keyof PackageExtras; label: TKey }[] = [
    { key: 'insurance', label: 'booking.extra.insurance' },
    { key: 'lounge', label: 'booking.extra.lounge' },
    ...(visaIncluded ? [] : [{ key: 'visa' as const, label: 'booking.extra.visa' as TKey }]),
  ]

  const proceed = () =>
    push({ name: 'payment', draft: makePackageDraft(travelPackage, { adults, children, optionId, extras, startDate: start, endDate: end }) })

  return (
    <Screen
      label={t('booking.title')}
      header={<ScreenHeader title={t('booking.title')} />}
      footer={<BookingFooter total={total} onContinue={proceed} />}
      className="px-5 pb-8 pt-2"
    >
      <SummaryCard
        image={travelPackage.image}
        title={L(travelPackage.title)}
        subtitle={L(destination.region)}
        meta={`${tp('common.nights', travelPackage.nights)} · ${L(travelPackage.board)}`}
      />

      <Section title={t('booking.dates')}>
        <div className="grid grid-cols-2 gap-3">
          <PickerField
            label={t('booking.start')}
            icon={<CalendarDays />}
            value={fmt(start)}
            onClick={() => !fixed && setDatesOpen(true)}
            className={cn(fixed && 'cursor-default opacity-80 hover:bg-white/[0.04]')}
          />
          <PickerField label={t('booking.end')} icon={<CalendarDays />} value={fmt(end)} onClick={() => !fixed && setDatesOpen(true)} className={cn(fixed && 'cursor-default opacity-80 hover:bg-white/[0.04]')} />
        </div>
        {fixed && <p className="mt-2.5 text-[12.5px] leading-relaxed text-fg-subtle">{t('booking.fixedDates')}</p>}
      </Section>

      <Section title={t('booking.travellers')}>
        <Card className="divide-y divide-white/[0.06]">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div>
              <p className="text-[14.5px] font-medium">{t('booking.adults')}</p>
              <p className="text-[12px] text-fg-subtle">{t('flights.adultsHint')}</p>
            </div>
            <Stepper label={t('booking.adults')} value={adults} min={1} max={8} onChange={setAdults} />
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <div>
              <p className="text-[14.5px] font-medium">{t('booking.children')}</p>
              <p className="text-[12px] text-fg-subtle">{t('flights.childrenHint')}</p>
            </div>
            <Stepper label={t('booking.children')} value={children} min={0} max={6} onChange={setChildren} />
          </div>
        </Card>
      </Section>

      <Section title={travelPackage.kind === 'umrah' ? t('booking.optionUmrah') : t('booking.option')}>
        <div className="flex flex-wrap gap-2">
          {travelPackage.options.map((option) => (
            <Chip key={option.id} selected={optionId === option.id} onClick={() => setOptionId(option.id)}>
              {L(option.label)}
              {option.delta > 0 && <span className="text-fg-subtle">+{money(option.delta)}</span>}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title={t('booking.extras')}>
        <Card className="divide-y divide-white/[0.06]">
          {visaIncluded && (
            <div className="flex items-center gap-3 px-4 py-3.5">
              <BadgeCheck className="size-5 text-success" />
              <p className="flex-1 text-[14.5px] font-medium">{t('booking.visaIncluded')}</p>
              <span className="text-[12.5px] font-semibold text-success">{t('common.included')}</span>
            </div>
          )}
          {extraRows.map((row) => (
            <ExtraRow
              key={row.key}
              label={t(row.label)}
              hint={t('booking.perPerson', { price: money(PACKAGE_EXTRA_PRICES[row.key]) })}
              checked={extras[row.key]}
              onChange={(value) => setExtras((current) => ({ ...current, [row.key]: value }))}
            />
          ))}
        </Card>
      </Section>

      <Section title={`${t('booking.breakdown')} · ${tp('common.travellers', travellers)}`}>
        <Breakdown lines={lines} total={total} />
      </Section>

      <DatesSheet
        open={datesOpen}
        onClose={() => setDatesOpen(false)}
        mode="single"
        start={start}
        onApply={(value) => setStart(value)}
      />
    </Screen>
  )
}

function HotelBooking({ hotelId, checkIn, checkOut, adults: initialAdults, rooms: initialRooms }: Extract<BookableItem, { kind: 'hotel' }>) {
  const { t, tp, L, money, date, num } = useI18n()
  const { push } = useNav()
  const hotel = getHotel(hotelId)
  const [range, setRange] = useState({ start: checkIn, end: checkOut })
  const [rooms,setRooms] = useState(initialRooms ?? Math.ceil(initialAdults / 2))
  const [adults, setAdults] = useState(initialAdults)
  const [optionId, setOptionId] = useState<string>(HOTEL_OPTIONS[0].id)
  const [extras, setExtras] = useState<HotelExtras>({ transfer: true, insurance: false })
  const [datesOpen, setDatesOpen] = useState(false)
  const nights = Math.max(1, daysBetween(range.start, range.end))
  const lines = hotelQuote(hotel, { nights, adults, rooms, optionId, extras })
  const total = sumLines(lines)
  const fmt = (iso: string) => date(iso, { weekday: 'short', day: 'numeric', month: 'short' })

  const proceed = () =>
    push({ name: 'payment', draft: makeHotelDraft(hotel, { nights, adults, rooms, optionId, extras, startDate: range.start, endDate: range.end }) })

  return (
    <Screen
      label={t('booking.title')}
      header={<ScreenHeader title={t('booking.title')} />}
      footer={<BookingFooter total={total} onContinue={proceed} />}
      className="px-5 pb-8 pt-2"
    >
      <SummaryCard
        image={hotel.image}
        title={L(hotel.name)}
        subtitle={L(hotel.area)}
        meta={
          <span className="flex items-center gap-1">
            {Array.from({ length: hotel.stars }, (_, i) => (
              <Star key={i} className="size-3 fill-warning text-warning" aria-hidden />
            ))}
            <span className="ms-1">{num(hotel.rating)}</span>
          </span>
        }
      />

      <Section title={t('booking.dates')}>
        <div className="grid grid-cols-2 gap-3">
          <PickerField label={t('booking.checkIn')} icon={<CalendarDays />} value={fmt(range.start)} onClick={() => setDatesOpen(true)} />
          <PickerField label={t('booking.checkOut')} icon={<CalendarDays />} value={fmt(range.end)} onClick={() => setDatesOpen(true)} />
        </div>
        <p className="mt-2.5 text-[12.5px] text-fg-subtle">{tp('common.nights', nights)}</p>
      </Section>

      <Section title={t('hotels.guests')}>
        <Card className="flex items-center justify-between px-4 py-3.5">
          <div>
            <p className="text-[14.5px] font-medium">{t('booking.adults')}</p>
            <p className="text-[12px] text-fg-subtle">{tp('booking.rooms', rooms)}</p>
          </div>
          <Stepper label={t('booking.adults')} value={adults} min={1} max={9} onChange={n=>{setAdults(n);setRooms(r=>Math.min(r,n))}} />
        </Card>
        <Card className="mt-2 flex items-center justify-between p-4"><span>{tp('booking.rooms',rooms)}</span><Stepper label={L({en:'Rooms',ar:'الغرف'})} value={rooms} min={1} max={adults} onChange={setRooms} /></Card>
      </Section>

      <Section title={t('booking.option')}>
        <div className="flex flex-wrap gap-2">
          {HOTEL_OPTIONS.map((option) => (
            <Chip key={option.id} selected={optionId === option.id} onClick={() => setOptionId(option.id)}>
              {t(option.key)}
              {option.delta > 0 && (
                <span className="text-fg-subtle">
                  +{money(option.delta)}/{t('hotels.night')}
                </span>
              )}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title={t('booking.extras')}>
        <Card className="divide-y divide-white/[0.06]">
          <ExtraRow
            label={t('booking.extra.transfer')}
            hint={t('booking.perBooking', { price: money(HOTEL_EXTRA_PRICES.transfer) })}
            checked={extras.transfer}
            onChange={(value) => setExtras((current) => ({ ...current, transfer: value }))}
          />
          <ExtraRow
            label={t('booking.extra.insurance')}
            hint={t('booking.perPerson', { price: money(HOTEL_EXTRA_PRICES.insurance) })}
            checked={extras.insurance}
            onChange={(value) => setExtras((current) => ({ ...current, insurance: value }))}
          />
        </Card>
      </Section>

      <Section title={t('booking.breakdown')}>
        <Breakdown lines={lines} total={total} />
      </Section>

      <DatesSheet
        open={datesOpen}
        onClose={() => setDatesOpen(false)}
        mode="range"
        start={range.start}
        end={range.end}
        onApply={(start, end) => setRange({ start, end: end ?? addDays(start, 1) })}
      />
    </Screen>
  )
}

export function BookingScreen({ item }: { item: BookableItem }) {
  return item.kind === 'package' ? <PackageBooking packageId={item.packageId} /> : <HotelBooking {...item} />
}

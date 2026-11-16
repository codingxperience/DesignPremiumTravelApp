import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { BedDouble, Bus, ChevronDown, ChevronLeft, FileText, Phone, ShieldCheck, Share2, Siren, Ticket, Umbrella } from 'lucide-react'
import { getAirport } from '@/data/airports'
import { CONTACT, USER } from '@/data/demo'
import { getDestination } from '@/data/destinations'
import { getHotel } from '@/data/hotels'
import { getPackage } from '@/data/packages'
import type { Booking, Flight } from '@/data/types'
import { cn } from '@/lib/cn'
import { daysBetween, TODAY_ISO } from '@/lib/dates'
import { translate, type TKey } from '@/lib/i18n'
import { useAppState, useDispatch, useI18n, useNav, useToast } from '@/state/store'
import { Button, IconButton } from '@/ui/Button'
import { Tabs } from '@/ui/Controls'
import { Heading } from '@/ui/Heading'
import { AirlineBadge, WhatsAppIcon } from '@/ui/Icons'
import { Img } from '@/ui/Img'
import { Badge, Card, ListRow } from '@/ui/Misc'
import { EASE_OUT, FLIP_RTL } from '@/ui/motion'
import { Screen } from '@/ui/Screen'
import { applicationInfo } from '../services/status'
import { isPast } from './Trips'

type TripTab = 'itinerary' | 'bookings' | 'documents'

function Itinerary({ booking }: { booking: Booking }) {
  const { L } = useI18n()
  const [open, setOpen] = useState(0)
  return (
    <div className="space-y-3">
      {booking.itinerary!.map((day, index) => {
        const expanded = open === index
        return (
          <Card key={day.label.en} className="overflow-hidden">
            <button
              type="button"
              onClick={() => setOpen(expanded ? -1 : index)}
              aria-expanded={expanded}
              className="flex w-full items-center gap-3.5 px-4 py-3.5 text-start"
            >
              <span className={cn('grid min-w-[46px] place-items-center rounded-[14px] px-2 py-2 text-center text-[11px] font-bold leading-tight', expanded ? 'bg-brand-orange text-ink-950' : 'bg-white/[0.06] text-fg-muted')}>
                {L(day.label)}
              </span>
              <span className="min-w-0 flex-1 text-[15px] font-semibold">{L(day.title)}</span>
              <ChevronDown className={cn('size-5 text-fg-subtle transition-transform duration-300', expanded && 'rotate-180')} />
            </button>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE_OUT }} className="overflow-hidden">
                  <ol className="relative px-4 pb-4">
                    {day.items.map((item, itemIndex) => (
                      <li key={item.text.en} className="relative flex gap-3.5 pb-3.5 last:pb-0">
                        <span className="w-11 shrink-0 pt-0.5 text-[12.5px] font-semibold tabular-nums text-orange-300">{item.time ?? '•'}</span>
                        <span className="relative flex flex-col items-center pt-1.5" aria-hidden>
                          <span className="size-2 rounded-full bg-white/40" />
                          {itemIndex < day.items.length - 1 && <span className="mt-1 w-px flex-1 bg-white/10" />}
                        </span>
                        <span className="flex-1 text-[13.5px] leading-relaxed text-fg-muted">{L(item.text)}</span>
                      </li>
                    ))}
                  </ol>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        )
      })}
    </div>
  )
}

function FlightRow({ flight, label, onTicket }: { flight: Flight; label: string; onTicket: () => void }) {
  const { t, L, date, duration } = useI18n()
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <AirlineBadge airline={flight.airline} />
        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] font-semibold">
            {label} · <span dir="ltr">{flight.number}</span>
          </p>
          <p className="text-[12.5px] text-fg-muted">
            {L(flight.airline.name)} · {date(flight.date, { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3" dir="ltr">
        <div>
          <p className="text-[19px] font-semibold tabular-nums">{flight.dep}</p>
          <p className="text-[12px] text-fg-muted">{flight.from}</p>
        </div>
        <div className="flex flex-1 flex-col items-center text-[11.5px] text-fg-subtle">
          {duration(flight.durationMin)}
          <span className="mt-1 h-px w-full border-t border-dashed border-white/20" />
        </div>
        <div className="text-right">
          <p className="text-[19px] font-semibold tabular-nums">{flight.arr}</p>
          <p className="text-[12px] text-fg-muted">{flight.to}</p>
        </div>
      </div>
      <Button variant="secondary" size="sm" block className="mt-4" icon={<Ticket className="size-4" />} onClick={onTicket}>
        {t('trip.viewTicket')}
      </Button>
      <p className="sr-only">
        {L(getAirport(flight.from).city)} – {L(getAirport(flight.to).city)}
      </p>
    </Card>
  )
}

export function TripDetailScreen({ bookingId }: { bookingId: string }) {
  const { t, tp, L, money, range, date } = useI18n()
  const { bookings, applications } = useAppState()
  const dispatch = useDispatch()
  const { pop, push } = useNav()
  const toast = useToast()
  const booking = bookings.find((b) => b.id === bookingId)
  const [tab, setTab] = useState<TripTab>(booking?.itinerary ? 'itinerary' : 'bookings')

  useEffect(() => {
    if (booking?.isNew) dispatch({ type: 'SEEN_BOOKING', id: booking.id })
  }, [booking?.id, booking?.isNew, dispatch])

  if (!booking) return null

  const destination = booking.destinationId ? getDestination(booking.destinationId) : undefined
  const hotel = booking.hotelId ? getHotel(booking.hotelId) : undefined
  const daysAway = daysBetween(TODAY_ISO, booking.startDate)
  const approval = destination?.visaService === 'egypt' ? applications.find((a) => a.service === 'egypt') : undefined
  const hasLine = (key: TKey) => booking.lines.some((line) => line.label.en === translate('en', key))
  const hasTransfers = hasLine('booking.extra.transfer') || (!!booking.packageId && getPackage(booking.packageId).includes.includes('transfer'))
  const hasInsurance = hasLine('booking.extra.insurance')
  const past = isPast(booking)

  const share = async () => {
    try {
      await navigator.clipboard?.writeText(`${booking.ref} · ${L(booking.title)}`)
    } catch {
      // Clipboard may be blocked in embedded previews.
    }
    toast(t('trip.shared'))
  }

  const tabs = [
    ...(booking.itinerary ? [{ value: 'itinerary' as const, label: t('trip.tab.itinerary') }] : []),
    { value: 'bookings' as const, label: t('trip.tab.bookings') },
    { value: 'documents' as const, label: t('trip.tab.documents') },
  ]

  const documents = [
    { icon: <FileText />, title: t('doc.passport'), subtitle: t('pay.passport', { last4: USER.passportLast4 }), badge: <Badge tone="success">{t('doc.verified')}</Badge> },
    ...(approval
      ? [
          {
            icon: <ShieldCheck />,
            title: L(applicationInfo(approval).title),
            subtitle: approval.ref,
            badge: <Badge tone={approval.status === 'approved' ? 'success' : 'warning'}>{approval.status === 'approved' ? t('doc.approved') : t('doc.inReview')}</Badge>,
            onClick: () => push({ name: 'applicationStatus', id: approval.id }),
          },
        ]
      : []),
    ...(hasInsurance ? [{ icon: <Umbrella />, title: t('doc.insurance'), subtitle: booking.ref, badge: <Badge tone="success">{t('doc.active')}</Badge> }] : []),
    { icon: <Ticket />, title: t('doc.confirmation'), subtitle: booking.ref, badge: <Badge tone="sky">{t('doc.ready')}</Badge> },
  ]

  return (
    <Screen label={L(booking.title)} className="pb-12">
      <div className="relative h-[330px] overflow-hidden">
        <Img id={booking.image} alt={L(booking.title)} width={390} height={330} priority className="absolute inset-0 size-full" />
        <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,11,23,0.6)_0%,rgba(5,11,23,0.05)_40%,#081226_100%)]" />
        <div className="absolute inset-x-4 top-[calc(var(--sat)+8px)] flex justify-between">
          <IconButton label={t('common.back')} variant="onImage" onClick={pop}>
            <ChevronLeft className={FLIP_RTL} />
          </IconButton>
          <IconButton label={t('trip.share')} variant="onImage" onClick={share}>
            <Share2 />
          </IconButton>
        </div>
        <div className="absolute inset-x-5 bottom-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={booking.status === 'deposit' ? 'warningOnImage' : 'successOnImage'} dot>
              {booking.status === 'deposit' ? t('trips.status.deposit') : t('trips.status.confirmed')}
            </Badge>
            {!past && daysAway > 0 && <Badge tone="glass">{tp('common.inDays', daysAway)}</Badge>}
          </div>
          <Heading as="h1" size="xl" className="mt-3 text-white">
            {L(booking.title)}
          </Heading>
          <p className="mt-1.5 text-[13.5px] text-white/80">
            {booking.endDate ? range(booking.startDate, booking.endDate, { day: 'numeric', month: 'short', year: 'numeric' }) : date(booking.startDate, { day: 'numeric', month: 'short', year: 'numeric' })} ·{' '}
            {tp('common.travellers', booking.adults + booking.children)}
          </p>
        </div>
      </div>

      <div className="px-5">
        <Tabs value={tab} onChange={setTab} options={tabs} label={L(booking.title)} />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tab} role="tabpanel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: EASE_OUT }} className="pt-5">
            {tab === 'itinerary' && booking.itinerary && (
              <>
                <Itinerary booking={booking} />
                {!past && (
                  <Card className="mt-5 overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-[13px] bg-brand-orange/14 text-orange-300">
                          <Phone className="size-5" />
                        </span>
                        <div>
                          <p className="text-[15px] font-semibold">{t('trip.assist.title')}</p>
                          <p className="text-[12.5px] text-fg-muted">{t('trip.assist.body')}</p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2.5">
                        <a href={CONTACT.phoneHref} className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-white/[0.07] text-[14px] font-semibold transition-colors hover:bg-white/[0.11]">
                          <Phone className="size-4" />
                          {t('common.call')}
                        </a>
                        <a href={CONTACT.whatsappHref} target="_blank" rel="noreferrer" className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#25D366]/15 text-[14px] font-semibold text-[#5be38f] transition-colors hover:bg-[#25D366]/25">
                          <WhatsAppIcon className="size-4" />
                          {t('common.whatsapp')}
                        </a>
                      </div>
                    </div>
                    {destination?.emergency && (
                      <div className="flex items-center gap-3 border-t border-white/[0.06] bg-danger/[0.06] px-4 py-3">
                        <Siren className="size-5 shrink-0 text-danger" />
                        <p className="text-[12.5px] text-fg-muted">
                          <span className="font-semibold text-fg">{t('trip.emergency')}: </span>
                          {t('trip.police')} {destination.emergency.police} · {t('trip.ambulance')} {destination.emergency.ambulance}
                          {destination.emergency.tourist && ` · ${t('trip.touristPolice')} ${destination.emergency.tourist}`}
                        </p>
                      </div>
                    )}
                  </Card>
                )}
              </>
            )}

            {tab === 'bookings' && (
              <div className="space-y-3">
                {booking.flight && (
                  <FlightRow flight={booking.flight.outbound} label={t('flights.outbound')} onTicket={() => push({ name: 'ticket', bookingId: booking.id })} />
                )}
                {booking.flight?.inbound && (
                  <FlightRow flight={booking.flight.inbound} label={t('flights.inbound')} onTicket={() => push({ name: 'ticket', bookingId: booking.id })} />
                )}
                {hotel && (
                  <Card className="flex items-center gap-3.5 p-3">
                    <span className="block size-16 shrink-0 overflow-hidden rounded-[16px] bg-ink-700">
                      <Img id={hotel.image} alt="" width={64} height={64} className="size-full" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-[12px] text-fg-subtle">
                        <BedDouble className="size-3.5" />
                        {t('trip.hotel')}
                      </p>
                      <p className="truncate text-[15px] font-semibold">{L(hotel.name)}</p>
                      <p className="truncate text-[12.5px] text-fg-muted">{L(hotel.area)}</p>
                    </div>
                  </Card>
                )}
                {hasTransfers && (
                  <Card>
                    <ListRow icon={<Bus />} title={t('trip.transfers')} subtitle={t('trip.transfersBody')} />
                  </Card>
                )}
                <Card className="p-4">
                  <ul className="space-y-2.5">
                    {booking.lines.map((line) => (
                      <li key={line.label.en} className="flex items-start justify-between gap-4 text-[13.5px]">
                        <span className="text-fg-muted">{L(line.label)}</span>
                        <span className={cn('shrink-0 font-medium tabular-nums', line.amount < 0 && 'text-success')}>
                          {line.amount < 0 ? `−${money(-line.amount)}` : money(line.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-4">
                    <span className="text-[15px] font-semibold">{t('common.total')}</span>
                    <span className="text-[19px] font-semibold tabular-nums">{money(booking.total)}</span>
                  </div>
                  {booking.balanceDue && (
                    <p className="mt-2 text-end text-[12.5px] text-warning">{t('trip.balanceDue', { date: date(booking.balanceDue, { day: 'numeric', month: 'long', year: 'numeric' }) })}</p>
                  )}
                  <p className="mt-3 text-[12px] text-fg-subtle" dir="ltr">
                    {booking.ref}
                  </p>
                </Card>
              </div>
            )}

            {tab === 'documents' && (
              <Card className="divide-y divide-white/[0.06] overflow-hidden">
                {documents.map((doc) => (
                  <ListRow
                    key={doc.title}
                    icon={doc.icon}
                    title={doc.title}
                    subtitle={doc.subtitle}
                    trailing={doc.badge}
                    onClick={'onClick' in doc ? doc.onClick : () => toast(t('doc.opened', { name: doc.title }))}
                  />
                ))}
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Screen>
  )
}

import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { ArrowRight, ChevronRight, Luggage, RotateCcw, Star } from 'lucide-react'
import type { Application, Booking } from '@/data/types'
import { cn } from '@/lib/cn'
import { daysBetween, TODAY_ISO } from '@/lib/dates'
import { TAB_BAR_SPACE } from '@/navigation/BottomNav'
import { useAppState, useDispatch, useI18n, useNav, useToast } from '@/state/store'
import { Button } from '@/ui/Button'
import { Segmented } from '@/ui/Controls'
import { Flag } from '@/ui/Flag'
import { Heading } from '@/ui/Heading'
import { Img } from '@/ui/Img'
import { Badge, Card, EmptyState } from '@/ui/Misc'
import { EASE_OUT, FLIP_RTL } from '@/ui/motion'
import { Screen } from '@/ui/Screen'
import { applicationInfo, StatusProgress, statusTone } from '../services/status'

export const isPast = (booking: Booking) => (booking.endDate ?? booking.startDate) < TODAY_ISO

function TripCard({ booking, index }: { booking: Booking; index: number }) {
  const { t, tp, L, range, date } = useI18n()
  const { push } = useNav()
  const daysAway = daysBetween(TODAY_ISO, booking.startDate)
  return (
    <motion.button
      type="button"
      onClick={() => push({ name: 'trip', bookingId: booking.id })}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT, delay: index * 0.07 }}
      className="relative block h-[226px] w-full overflow-hidden rounded-[28px] bg-ink-800 text-start shadow-[0_26px_40px_-26px_rgba(0,0,0,0.9)]"
    >
      <Img id={booking.image} alt="" width={350} height={226} className="absolute inset-0 size-full" />
      <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,11,23,0.55)_0%,rgba(5,11,23,0.05)_38%,rgba(5,11,23,0.92)_100%)]" />
      <div className="absolute inset-x-4 top-4 flex items-center gap-2">
        <Badge tone={booking.status === 'deposit' ? 'warningOnImage' : 'successOnImage'} dot>
          {booking.status === 'deposit' ? t('trips.status.deposit') : t('trips.status.confirmed')}
        </Badge>
        {booking.isNew && <Badge tone="solid">{t('common.new')}</Badge>}
        {daysAway > 0 && (
          <Badge tone="glass" className="ms-auto">
            {tp('common.inDays', daysAway)}
          </Badge>
        )}
      </div>
      <div className="absolute inset-x-4 bottom-4">
        <p className="heading text-[22px] leading-[1.1] text-white rtl:text-[20px] rtl:leading-[1.45]">{L(booking.title)}</p>
        <p className="mt-1.5 text-[13px] text-white/80">
          {booking.endDate ? range(booking.startDate, booking.endDate) : date(booking.startDate, { day: 'numeric', month: 'short' })} · {tp('common.travellers', booking.adults + booking.children)}
        </p>
        {booking.flight && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur" dir="ltr">
            {booking.flight.outbound.from}
            <ArrowRight className="size-3.5" aria-hidden />
            {booking.flight.outbound.to}
            <span className="text-white/60">·</span>
            {booking.flight.outbound.number}
          </p>
        )}
      </div>
    </motion.button>
  )
}

function ApplicationCard({ application }: { application: Application }) {
  const { t, L, relative } = useI18n()
  const { push } = useNav()
  const info = applicationInfo(application)
  return (
    <button
      type="button"
      onClick={() => push({ name: 'applicationStatus', id: application.id })}
      className="block w-full rounded-[24px] border border-white/[0.07] bg-white/[0.035] p-4 text-start transition-colors hover:bg-white/[0.055]"
    >
      <div className="flex items-center gap-3">
        <Flag code={info.flag} className="size-9" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{L(info.title)}</p>
          <p className="text-[12px] text-fg-subtle" dir="ltr">
            {application.ref}
          </p>
        </div>
        {application.isNew && <Badge tone="solid">{t('common.new')}</Badge>}
        <ChevronRight className={cn('size-5 text-fg-subtle', FLIP_RTL)} />
      </div>
      <div className="mt-4">
        <StatusProgress status={application.status} />
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3 text-[12px]">
        <Badge tone={statusTone(application.status)} dot>
          {t(`status.${application.status}`)}
        </Badge>
        <span className="text-fg-subtle">{t('trips.updated', { time: relative(new Date(application.updatedAt)) })}</span>
      </div>
    </button>
  )
}

function StarRating({ booking }: { booking: Booking }) {
  const { t } = useI18n()
  const dispatch = useDispatch()
  const toast = useToast()
  const [hover, setHover] = useState(0)
  const value = booking.rating ?? 0
  return (
    <div className="flex items-center gap-0.5" role="radiogroup" aria-label={t('trips.rate')} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={t('trips.rateAria', { n })}
          onMouseEnter={() => setHover(n)}
          onClick={() => {
            dispatch({ type: 'RATE_BOOKING', id: booking.id, rating: n })
            toast(t('trips.rated'))
          }}
          className="grid size-7 place-items-center"
        >
          <Star className={cn('size-[18px] transition-colors', (hover || value) >= n ? 'fill-warning text-warning' : 'text-fg-subtle')} />
        </button>
      ))}
    </div>
  )
}

function PastTrip({ booking }: { booking: Booking }) {
  const { t, L, range, date } = useI18n()
  const { push } = useNav()
  return (
    <Card className="p-3">
      <div className="flex gap-3.5">
        <button type="button" onClick={() => push({ name: 'trip', bookingId: booking.id })} className="block size-[84px] shrink-0 overflow-hidden rounded-[18px] bg-ink-700">
          <Img id={booking.image} alt={L(booking.title)} width={84} height={84} className="size-full" />
        </button>
        <div className="min-w-0 flex-1 py-0.5">
          <button type="button" onClick={() => push({ name: 'trip', bookingId: booking.id })} className="block w-full truncate text-start text-[15px] font-semibold">
            {L(booking.title)}
          </button>
          <p className="mt-0.5 text-[12.5px] text-fg-muted">{booking.endDate
              ? range(booking.startDate, booking.endDate, { day: 'numeric', month: 'short', year: 'numeric' })
              : date(booking.startDate, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          <div className="mt-2">
            {booking.rating ? (
              <div className="flex items-center gap-0.5" aria-label={t('common.ratingAria', { rating: booking.rating })}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={cn('size-4', booking.rating! >= n ? 'fill-warning text-warning' : 'text-fg-subtle')} aria-hidden />
                ))}
              </div>
            ) : (
              <>
                <p className="mb-0.5 text-[11.5px] text-fg-subtle">{t('trips.rate')}</p>
                <StarRating booking={booking} />
              </>
            )}
          </div>
        </div>
      </div>
      {booking.packageId && (
        <Button
          variant="secondary"
          size="sm"
          block
          className="mt-3"
          icon={<RotateCcw className="size-4" />}
          onClick={() => push({ name: 'booking', item: { kind: 'package', packageId: booking.packageId! } })}
        >
          {t('trips.bookAgain')}
        </Button>
      )}
    </Card>
  )
}

export function TripsScreen() {
  const { t, num } = useI18n()
  const { bookings, applications } = useAppState()
  const { setTab } = useNav()
  const [segment, setSegment] = useState<'upcoming' | 'past'>('upcoming')

  const upcoming = bookings
    .filter((b) => !isPast(b))
    .sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew) || a.startDate.localeCompare(b.startDate))
  const past = bookings.filter(isPast).sort((a, b) => b.startDate.localeCompare(a.startDate))
  const activeApplications = applications.filter((a) => a.status !== 'approved')

  return (
    <Screen bottomInset={TAB_BAR_SPACE} label={t('trips.title')} className="px-5 pt-[calc(var(--sat)+18px)]">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(110%_60%_at_80%_0%,rgba(22,69,137,0.55),rgba(8,18,38,0)_70%)]" />
      <Heading as="h1" size="xl" className="relative">
        {t('trips.title')}
      </Heading>
      <Segmented
        className="relative mt-5"
        label={t('trips.title')}
        value={segment}
        onChange={setSegment}
        options={[
          { value: 'upcoming', label: `${t('trips.upcoming')} · ${num(upcoming.length)}` },
          { value: 'past', label: `${t('trips.past')} · ${num(past.length)}` },
        ]}
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={segment}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          className="relative"
        >
          {segment === 'upcoming' ? (
            upcoming.length || activeApplications.length ? (
              <>
                {activeApplications.length > 0 && (
                  <section className="mt-7">
                    <h2 className="mb-3 text-[15px] font-semibold">{t('trips.applications')}</h2>
                    <div className="space-y-3">
                      {activeApplications.map((application) => (
                        <ApplicationCard key={application.id} application={application} />
                      ))}
                    </div>
                  </section>
                )}
                {upcoming.length > 0 && (
                  <section className="mt-7">
                    <h2 className="mb-3 text-[15px] font-semibold">{t('trips.bookings')}</h2>
                    <div className="space-y-4">
                      {upcoming.map((booking, index) => (
                        <TripCard key={booking.id} booking={booking} index={index} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            ) : (
              <EmptyState icon={<Luggage />} title={t('trips.empty.title')} body={t('trips.empty.body')} action={t('trips.empty.cta')} onAction={() => setTab('explore')} />
            )
          ) : past.length ? (
            <div className="mt-7 space-y-3">
              {past.map((booking) => (
                <PastTrip key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <EmptyState icon={<Luggage />} title={t('trips.empty.title')} body={t('trips.empty.body')} action={t('trips.empty.cta')} onAction={() => setTab('explore')} />
          )}
        </motion.div>
      </AnimatePresence>
    </Screen>
  )
}

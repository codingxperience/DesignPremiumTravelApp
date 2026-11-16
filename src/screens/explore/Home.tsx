import { AnimatePresence } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, BadgePercent, Bell, Headset, Search, ShieldCheck, SlidersHorizontal, Timer } from 'lucide-react'
import { LogoLockup } from '@/brand/Logo'
import { getAirport } from '@/data/airports'
import { SEED_NOTIFICATIONS, USER } from '@/data/demo'
import { DESTINATIONS, getDestination, HOME_RAIL } from '@/data/destinations'
import { farePrice, searchFlights } from '@/data/flights'
import type { Category, FlightQuery } from '@/data/types'
import { cn } from '@/lib/cn'
import { fromToday } from '@/lib/dates'
import type { TKey } from '@/lib/i18n'
import { PHOTOS } from '@/lib/images'
import { SERVICES } from '@/navigation/items'
import { TAB_BAR_SPACE } from '@/navigation/BottomNav'
import { SERVICE_ROUTES } from '@/state/routes'
import { useAppState, useI18n, useNav } from '@/state/store'
import { IconButton } from '@/ui/Button'
import { Heading } from '@/ui/Heading'
import { Img } from '@/ui/Img'
import { Badge, Card, SectionHeader } from '@/ui/Misc'
import { FLIP_RTL } from '@/ui/motion'
import { Screen } from '@/ui/Screen'
import { Avatar, DestinationCard } from './shared'

const RAILS: { id: Category; label: TKey; kicker: TKey }[] = [
  { id: 'city', label: 'home.rail.city', kicker: 'home.kicker.city' },
  { id: 'umrah', label: 'home.rail.umrah', kicker: 'home.kicker.umrah' },
  { id: 'holiday', label: 'home.rail.holiday', kicker: 'home.kicker.holiday' },
]

const POPULAR_ROUTES = ['CAI', 'JED', 'IST', 'DXB']

function greetingKey(hour: number): TKey {
  if (hour < 12) return 'home.greeting.morning'
  if (hour < 18) return 'home.greeting.afternoon'
  return 'home.greeting.evening'
}

function RecommendedRail() {
  const [rail, setRail] = useState<Category>('city')
  const scroller = useRef<HTMLDivElement>(null)
  const { push } = useNav()
  const { t } = useI18n()
  const active = RAILS.find((r) => r.id === rail)!

  useEffect(() => {
    scroller.current?.scrollTo({ left: 0 })
  }, [rail])

  return (
    <div className="mt-4 flex">
      <div role="tablist" aria-orientation="vertical" aria-label={t('home.recommended')} className="flex w-[54px] shrink-0 flex-col justify-around py-3">
        {RAILS.map((item) => {
          const selected = item.id === rail
          return (
            <div key={item.id} className="relative flex justify-center">
              <span
                aria-hidden
                className={cn(
                  'absolute start-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-e-full bg-brand-orange transition-opacity duration-300',
                  selected ? 'opacity-100' : 'opacity-0',
                )}
              />
              <button
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setRail(item.id)}
                className={cn(
                  'rotate-180 py-2 text-[12.5px] font-semibold tracking-[0.06em] transition-colors duration-300 [writing-mode:vertical-rl] rtl:rotate-0',
                  selected ? 'text-fg' : 'text-fg-subtle hover:text-fg-muted',
                )}
              >
                {t(item.label)}
              </button>
            </div>
          )
        })}
      </div>
      <div ref={scroller} className="no-scrollbar flex min-w-0 flex-1 snap-x snap-mandatory gap-3.5 overflow-x-auto pb-2 pe-5">
        <AnimatePresence mode="popLayout" initial={false}>
          {HOME_RAIL[rail].map((id, index) => (
            <DestinationCard
              key={`${rail}-${id}`}
              destination={getDestination(id)}
              kicker={t(active.kicker)}
              index={index}
              onOpen={() => push({ name: 'destination', id })}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

function OfferBanner() {
  const { t } = useI18n()
  const { push } = useNav()
  return (
    <button
      type="button"
      onClick={() => push({ name: 'egypt' })}
      className="relative block min-h-[204px] w-full overflow-hidden rounded-[28px] bg-brand-blue text-start shadow-[0_30px_50px_-30px_rgba(22,69,137,0.9)]"
    >
      <Img id={PHOTOS.sphinxPyramid} alt="" width={260} height={204} className="absolute inset-y-0 end-0 h-full w-[64%]" />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(90deg,#164589_36%,rgba(22,69,137,0.55)_64%,rgba(22,69,137,0.05)_100%)] rtl:bg-[linear-gradient(270deg,#164589_36%,rgba(22,69,137,0.55)_64%,rgba(22,69,137,0.05)_100%)]"
      />
      <span aria-hidden className="heading absolute -bottom-5 end-3 text-[92px] leading-none text-white/[0.09]">
        30%
      </span>
      <div className="relative flex min-h-[204px] max-w-[70%] flex-col justify-between gap-4 p-5">
        <Badge tone="solid" className="self-start">
          {t('home.offer.kicker')}
        </Badge>
        <div>
          <p className="heading text-[21px] leading-[1.12] text-white rtl:text-[19px] rtl:leading-[1.45]">{t('home.offer.title')}</p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-white/75">{t('home.offer.body')}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-orange-200">
          {t('home.offer.cta')}
          <ArrowRight className={cn('size-4', FLIP_RTL)} />
        </span>
      </div>
    </button>
  )
}

function PopularRoutes() {
  const { t, tp, L, money, duration } = useI18n()
  const { push } = useNav()
  const routes = useMemo(
    () =>
      POPULAR_ROUTES.map((code) => {
        const query: FlightQuery = { tripType: 'return', from: 'LHR', to: code, depart: fromToday(21), ret: fromToday(28), adults: 1, children: 0, infants: 0, cabin: 'economy' }
        const flights = searchFlights(query)
        const direct = flights.filter((f) => f.stops === 0)
        const fastest = Math.min(...(direct.length ? direct : flights).map((f) => f.durationMin))
        return {
          code,
          destination: DESTINATIONS.find((d) => d.airport === code)!,
          price: Math.min(...flights.map((f) => farePrice(f, 'light'))),
          stops: direct.length ? 0 : Math.min(...flights.map((f) => f.stops)),
          fastest,
        }
      }),
    [],
  )

  return (
    <Card className="mx-5 mt-4 divide-y divide-white/[0.06] overflow-hidden">
      {routes.map((route) => (
        <button
          key={route.code}
          type="button"
          onClick={() => push({ name: 'flightSearch', to: route.code })}
          className="flex w-full items-center gap-3.5 px-4 py-3.5 text-start transition-colors hover:bg-white/[0.03]"
        >
          <span className="block size-12 shrink-0 overflow-hidden rounded-[14px] bg-ink-700">
            <Img id={route.destination.image} alt="" width={48} height={48} className="size-full" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-[15px] font-semibold">
              {L(getAirport('LHR').city)}
              <ArrowRight className={cn('size-3.5 text-fg-subtle', FLIP_RTL)} aria-hidden />
              <span className="truncate">{L(getAirport(route.code).city)}</span>
            </span>
            <span className="mt-0.5 block text-[12.5px] text-fg-muted">
              {route.stops === 0 ? t('common.direct') : tp('common.stops', route.stops)} · {duration(route.fastest)}
            </span>
          </span>
          <span className="text-end">
            <span className="block text-[11.5px] text-fg-subtle">{t('common.from')}</span>
            <span className="block text-[16px] font-semibold tabular-nums">{money(route.price)}</span>
          </span>
        </button>
      ))}
    </Card>
  )
}

const WHY: { icon: typeof Timer; title: TKey; body: TKey }[] = [
  { icon: BadgePercent, title: 'home.why.offers', body: 'home.why.offers.body' },
  { icon: Timer, title: 'home.why.fast', body: 'home.why.fast.body' },
  { icon: ShieldCheck, title: 'home.why.secure', body: 'home.why.secure.body' },
  { icon: Headset, title: 'home.why.support', body: 'home.why.support.body' },
]

export function HomeScreen() {
  const { t, L } = useI18n()
  const { push } = useNav()
  const { notificationsRead, notificationsEnabled } = useAppState()
  const unread = notificationsEnabled && !notificationsRead && SEED_NOTIFICATIONS.some((n) => Date.now() - n.at < 86_400_000)
  const [hour] = useState(() => new Date().getHours())

  return (
    <Screen bottomInset={TAB_BAR_SPACE} label={t('nav.explore')}>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[440px] bg-[radial-gradient(120%_70%_at_20%_0%,rgba(22,69,137,0.65),rgba(8,18,38,0)_70%)]" />

      <header className="relative flex items-center justify-between px-5 pt-[calc(var(--sat)+10px)]">
        <div className="flex items-center gap-3">
          <Avatar id={USER.avatar} alt={USER.name} className="size-11 ring-2 ring-white/10" />
          <div>
            <p className="text-[12.5px] text-fg-muted">{t(greetingKey(hour))}</p>
            <p className="text-[16px] font-semibold">{L(USER.firstName)}</p>
          </div>
        </div>
        <IconButton label={unread ? t('home.notificationsNew') : t('home.notifications')} onClick={() => push({ name: 'notifications' })}>
          <Bell />
          {unread && <span aria-hidden className="absolute end-2.5 top-2.5 size-2 rounded-full bg-brand-orange ring-2 ring-ink-900" />}
        </IconButton>
      </header>

      <div className="relative px-5 pt-7">
        <p className="overline text-orange-300">{t('brand.tagline')}</p>
        <Heading as="h1" size="xl" className="mt-2.5">
          {t('home.title')}
        </Heading>
        <button
          type="button"
          onClick={() => push({ name: 'search' })}
          className="glass mt-5 flex h-14 w-full items-center gap-3 rounded-[18px] pe-1.5 ps-4 text-start transition-colors hover:bg-white/[0.08]"
        >
          <Search className="size-5 text-fg-subtle" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-[14.5px] text-fg-subtle">{t('home.search')}</span>
          <span aria-hidden className="grid size-11 place-items-center rounded-[14px] bg-brand-orange text-ink-950">
            <SlidersHorizontal className="size-5" />
          </span>
        </button>
      </div>

      <section aria-label={t('home.services')} className="relative mt-5 grid grid-cols-3 gap-2.5 px-5">
        {SERVICES.map((service) => {
          const Icon = service.icon
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => push(SERVICE_ROUTES[service.id])}
              className="relative flex h-[60px] items-center gap-2.5 rounded-[18px] border border-white/[0.07] bg-white/[0.035] px-2.5 text-start transition-colors hover:bg-white/[0.06]"
            >
              <span
                className={cn(
                  'grid size-9 shrink-0 place-items-center rounded-[12px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]',
                  service.offer ? 'bg-[linear-gradient(150deg,#ff8a4c,#d9531a)]' : 'bg-[linear-gradient(150deg,#2a62b4,#123566)]',
                )}
              >
                <Icon className="size-[18px]" />
              </span>
              <span className="line-clamp-2 text-[12px] font-semibold leading-[1.2]">{t(service.label)}</span>
              {service.offer && <span aria-hidden className="absolute end-2 top-2 size-1.5 rounded-full bg-brand-orange" />}
            </button>
          )
        })}
      </section>

      <section className="mt-9" aria-labelledby="recommended-title">
        <SectionHeader title={<span id="recommended-title">{t('home.recommended')}</span>} />
        <RecommendedRail />
      </section>

      <section className="mt-8 px-5">
        <OfferBanner />
      </section>

      <section className="mt-9">
        <SectionHeader title={t('home.routes')} action={t('common.seeAll')} onAction={() => push({ name: 'flightSearch' })} />
        <PopularRoutes />
      </section>

      <section className="mt-9">
        <SectionHeader title={t('home.why')} />
        <div className="mt-4 grid grid-cols-2 gap-3 px-5">
          {WHY.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="p-4">
              <span className="grid size-10 place-items-center rounded-[13px] bg-brand-orange/12 text-orange-300">
                <Icon className="size-5" />
              </span>
              <p className="mt-3.5 text-[14.5px] font-semibold">{t(title)}</p>
              <p className="mt-1 text-[12.5px] leading-snug text-fg-muted">{t(body)}</p>
            </Card>
          ))}
        </div>
      </section>

      <footer className="mt-12 flex flex-col items-center px-8 text-center">
        <LogoLockup className="w-[112px] opacity-90" />
        <p className="mt-5 text-[13px] font-semibold text-fg-muted">
          <span lang="en">Your Journey, Our Priority</span>
          <span className="mx-2 text-fg-subtle">|</span>
          <span lang="ar">رحلتك، أولويتنا</span>
        </p>
        <p className="mt-2 text-[11.5px] leading-relaxed text-fg-subtle">
          {t('brand.company')}
          <br />
          {t('brand.location')}
        </p>
      </footer>
    </Screen>
  )
}

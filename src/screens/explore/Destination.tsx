import { AnimatePresence, motion, useTransform } from 'motion/react'
import { useState } from 'react'
import {
  ArrowRight,
  Banknote,
  BedDouble,
  Bus,
  CalendarDays,
  ChevronLeft,
  Clock3,
  CloudSun,
  Compass,
  Languages,
  MapPin,
  Plane,
  Plug,
  Share2,
  Siren,
  Stamp,
  Utensils,
  type LucideIcon,
} from 'lucide-react'
import { getDestination } from '@/data/destinations'
import { getPackage } from '@/data/packages'
import type { Inclusion, TravelPackage } from '@/data/types'
import { cn } from '@/lib/cn'
import type { TKey } from '@/lib/i18n'
import type { DestinationTab } from '@/state/routes'
import { useI18n, useNav, useToast } from '@/state/store'
import { Button, IconButton } from '@/ui/Button'
import { Tabs } from '@/ui/Controls'
import { Heading } from '@/ui/Heading'
import { KaabaIcon } from '@/ui/Icons'
import { Img } from '@/ui/Img'
import { Badge, Card, RatingPill } from '@/ui/Misc'
import { EASE_OUT, FLIP_RTL } from '@/ui/motion'
import { Screen, StickyFooter, useScreenScroll } from '@/ui/Screen'
import { SaveButton } from './shared'

const HERO_HEIGHT = 520

export const INCLUSION_ICONS: Record<Inclusion, { icon: LucideIcon | typeof KaabaIcon; label: TKey }> = {
  flight: { icon: Plane, label: 'include.flight' },
  hotel: { icon: BedDouble, label: 'include.hotel' },
  transfer: { icon: Bus, label: 'include.transfer' },
  guide: { icon: Compass, label: 'include.guide' },
  visa: { icon: Stamp, label: 'include.visa' },
  meals: { icon: Utensils, label: 'include.meals' },
  ziyarat: { icon: KaabaIcon, label: 'include.ziyarat' },
}

export function InclusionList({ includes, className }: { includes: Inclusion[]; className?: string }) {
  const { t } = useI18n()
  return (
    <ul className={cn('flex flex-wrap gap-x-3.5 gap-y-2', className)}>
      {includes.map((item) => {
        const { icon: Icon, label } = INCLUSION_ICONS[item]
        return (
          <li key={item} className="flex items-center gap-1.5 text-[12.5px] text-fg-muted">
            <Icon className="size-4 text-orange-300" />
            {t(label)}
          </li>
        )
      })}
    </ul>
  )
}

export function PackageCard({ travelPackage, onSelect }: { travelPackage: TravelPackage; onSelect: () => void }) {
  const { t, tp, L, money } = useI18n()
  return (
    <Card className="overflow-hidden">
      <div className="relative h-36 bg-ink-800">
        <Img id={travelPackage.image} alt="" width={350} height={144} className="absolute inset-0 size-full" />
        <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(5,11,23,0.7))]" />
        {travelPackage.tag && (
          <Badge tone="solid" className="absolute start-3 top-3">
            {L(travelPackage.tag)}
          </Badge>
        )}
        <Badge tone="glass" className="absolute bottom-3 start-3">
          {tp('common.nights', travelPackage.nights)} · {L(travelPackage.board)}
        </Badge>
      </div>
      <div className="p-4">
        <h3 className="text-[16.5px] font-semibold leading-snug">{L(travelPackage.title)}</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">{L(travelPackage.summary)}</p>
        <InclusionList includes={travelPackage.includes} className="mt-3.5" />
        <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/[0.06] pt-4">
          <p>
            <span className="block text-[11.5px] text-fg-subtle">{t('common.from')}</span>
            <span className="text-[20px] font-semibold tabular-nums">{money(travelPackage.price)}</span>
            <span className="text-[12px] text-fg-muted"> / {t('common.perPerson')}</span>
          </p>
          <Button size="sm" onClick={onSelect} iconEnd={<ArrowRight className={cn('size-4', FLIP_RTL)} />}>
            {t('dest.select')}
          </Button>
        </div>
      </div>
    </Card>
  )
}

function ParallaxPhoto({ photo, alt }: { photo: string; alt: string }) {
  const { scrollY } = useScreenScroll()
  const y = useTransform(scrollY, [0, HERO_HEIGHT], [0, HERO_HEIGHT * 0.38])
  return (
    <motion.div className="absolute inset-0" style={{ y }}>
      <AnimatePresence initial={false}>
        <motion.div
          key={photo}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
        >
          <Img id={photo} alt={alt} width={390} height={HERO_HEIGHT} priority className="size-full" />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

function FloatingBar({ title, id }: { title: string; id: string }) {
  const { t } = useI18n()
  const { pop } = useNav()
  const toast = useToast()
  const { scrollY } = useScreenScroll()
  const solid = useTransform(scrollY, [HERO_HEIGHT - 180, HERO_HEIGHT - 110], [0, 1])

  const share = async () => {
    try {
      await navigator.clipboard?.writeText(`${window.location.origin}${window.location.pathname}?screen=destination`)
    } catch {
      // Clipboard access can be blocked inside embedded previews; the toast still confirms the intent.
    }
    toast(t('common.linkCopied'))
  }

  return (
    <div className="sticky top-0 z-30 h-0">
      <div className="absolute inset-x-0 top-0">
        <motion.div aria-hidden style={{ opacity: solid }} className="absolute inset-0 border-b border-white/[0.06] bg-ink-900/85 backdrop-blur-xl" />
        <div className="relative flex h-[calc(var(--sat)+56px)] items-end gap-2 px-4 pb-1.5">
          <IconButton label={t('common.back')} variant="onImage" onClick={pop}>
            <ChevronLeft className={FLIP_RTL} />
          </IconButton>
          <motion.p style={{ opacity: solid }} className="flex h-11 min-w-0 flex-1 items-center justify-center truncate text-[16px] font-semibold">
            {title}
          </motion.p>
          <IconButton label={t('common.share')} variant="onImage" onClick={share}>
            <Share2 />
          </IconButton>
          <SaveButton id={id} name={title} size="lg" />
        </div>
      </div>
    </div>
  )
}

function Fact({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/[0.07] bg-white/[0.03] p-3.5">
      <Icon className="size-[18px] text-orange-300" />
      <p className="mt-2.5 text-[11.5px] text-fg-subtle">{label}</p>
      <p className="mt-0.5 text-[14px] font-semibold">{value}</p>
    </div>
  )
}

export function DestinationScreen({ id, initialTab = 'overview' }: { id: string; initialTab?: DestinationTab }) {
  const destination = getDestination(id)
  const { t, tp, L, money, num } = useI18n()
  const { push } = useNav()
  const [photo, setPhoto] = useState(destination.gallery[0])
  const [tab, setTab] = useState<DestinationTab>(initialTab)
  const [expanded, setExpanded] = useState(false)
  const packages = destination.packageIds.map(getPackage)
  const name = L(destination.name)

  const book = () => {
    if (packages[0]) push({ name: 'booking', item: { kind: 'package', packageId: packages[0].id } })
    else push({ name: 'flightSearch', to: destination.airport })
  }

  return (
    <Screen
      label={name}
      footer={
        <StickyFooter className="flex items-center justify-between gap-4">
          <p>
            <span className="block text-[12px] text-fg-subtle">{t('common.from')}</span>
            <span className="text-[22px] font-semibold tabular-nums">{money(destination.priceFrom)}</span>
            <span className="text-[12.5px] text-fg-muted"> / {t('common.perPerson')}</span>
          </p>
          <Button onClick={book} className="min-w-[156px]" iconEnd={<ArrowRight className={cn('size-5', FLIP_RTL)} />}>
            {t('dest.bookNow')}
          </Button>
        </StickyFooter>
      }
    >
      <FloatingBar title={name} id={destination.id} />

      <div className="relative overflow-hidden" style={{ height: HERO_HEIGHT }}>
        <ParallaxPhoto photo={photo} alt={name} />
        <div aria-hidden className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(5,11,23,0.6),transparent)]" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-72 bg-[linear-gradient(0deg,#081226_6%,rgba(8,18,38,0.75)_45%,transparent)]" />

        <div className="absolute end-4 top-[calc(var(--sat)+84px)] flex flex-col gap-2.5" role="group" aria-label={name}>
          {destination.gallery.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setPhoto(image)}
              aria-label={t('dest.photo', { n: index + 1 })}
              aria-pressed={photo === image}
              className={cn(
                'size-[54px] overflow-hidden rounded-[16px] border-2 transition-all duration-300',
                photo === image ? 'border-brand-orange shadow-[0_8px_20px_-6px_rgba(243,99,36,0.8)]' : 'border-white/40 opacity-80 hover:opacity-100',
              )}
            >
              <Img id={image} alt="" width={54} height={54} className="size-full" />
            </button>
          ))}
        </div>

        <div className="absolute inset-x-5 bottom-10">
          <div className="flex items-center gap-2">
            <RatingPill rating={destination.rating} />
            <span className="text-[12.5px] text-white/75">{tp('common.reviews', destination.reviews)}</span>
          </div>
          <Heading as="h1" size="2xl" className="mt-3 max-w-[290px] text-white">
            {name}
          </Heading>
          <p className="mt-2.5 flex items-center gap-1.5 text-[14px] text-white/80">
            <MapPin className="size-4" aria-hidden />
            {L(destination.region)}
          </p>
        </div>
      </div>

      <div className="relative -mt-4 rounded-t-[30px] bg-ink-900 px-5 pt-3">
        <Tabs
          value={tab}
          onChange={setTab}
          label={name}
          options={[
            { value: 'overview', label: t('dest.tab.overview') },
            { value: 'packages', label: `${t('dest.tab.packages')} · ${num(packages.length)}` },
            { value: 'essentials', label: t('dest.tab.essentials') },
          ]}
        />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            role="tabpanel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="pb-8 pt-5"
          >
            {tab === 'overview' && (
              <>
                <p className={cn('text-[15px] leading-[1.7] text-fg-muted', !expanded && 'line-clamp-4')}>{L(destination.description)}</p>
                <button type="button" onClick={() => setExpanded(!expanded)} className="mt-2 text-[13.5px] font-semibold text-orange-300 hover:text-orange-200">
                  {expanded ? t('dest.readLess') : t('dest.readMore')}
                </button>
                <h2 className="mt-7 text-[16px] font-semibold">{t('dest.highlights')}</h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {destination.highlights.map((highlight) => (
                    <li key={highlight.en} className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[13px] text-fg">
                      {L(highlight)}
                    </li>
                  ))}
                </ul>
                <div className="mt-7 grid grid-cols-2 gap-3">
                  <Fact icon={Plane} label={t('dest.facts.flight')} value={L(destination.flightTime)} />
                  <Fact icon={CalendarDays} label={t('dest.facts.best')} value={L(destination.bestTime)} />
                  <Fact icon={Clock3} label={t('dest.facts.time')} value={destination.timezone} />
                  <Fact icon={Banknote} label={t('dest.facts.currency')} value={L(destination.currency)} />
                </div>
                <Button
                  variant="secondary"
                  block
                  className="mt-5"
                  icon={<Plane className={cn('size-5', FLIP_RTL)} />}
                  onClick={() => push({ name: 'flightSearch', to: destination.airport })}
                >
                  {t('dest.flightsCta')}
                </Button>
              </>
            )}

            {tab === 'packages' && (
              <div className="space-y-4">
                {packages.map((travelPackage) => (
                  <PackageCard
                    key={travelPackage.id}
                    travelPackage={travelPackage}
                    onSelect={() => push({ name: 'booking', item: { kind: 'package', packageId: travelPackage.id } })}
                  />
                ))}
              </div>
            )}

            {tab === 'essentials' && (
              <div className="space-y-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-9 place-items-center rounded-[12px] bg-brand-orange/14 text-orange-300">
                      <Stamp className="size-[18px]" />
                    </span>
                    <h2 className="text-[15.5px] font-semibold">{t('dest.visa')}</h2>
                  </div>
                  <p className="mt-3 text-[13.5px] leading-relaxed text-fg-muted">{L(destination.visa)}</p>
                  {destination.visaService && (
                    <Button
                      variant="outline"
                      size="md"
                      block
                      className="mt-4"
                      onClick={() => push(destination.visaService === 'egypt' ? { name: 'egypt' } : { name: 'visa' })}
                    >
                      {t('dest.visaCta')}
                    </Button>
                  )}
                </Card>
                <Card className="divide-y divide-white/[0.06]">
                  {[
                    { icon: CloudSun, label: t('dest.weather'), value: L(destination.weather) },
                    { icon: Languages, label: t('dest.language'), value: L(destination.language) },
                    { icon: Plug, label: t('dest.plugs'), value: L(destination.plugs) },
                    { icon: Clock3, label: t('dest.facts.time'), value: destination.timezone },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3.5 px-4 py-3.5">
                      <Icon className="size-5 shrink-0 text-fg-subtle" />
                      <span className="flex-1 text-[14px] text-fg-muted">{label}</span>
                      <span className="text-end text-[14px] font-semibold">{value}</span>
                    </div>
                  ))}
                </Card>
                {destination.emergency && (
                  <Card className="flex items-center gap-3.5 p-4">
                    <span className="grid size-10 place-items-center rounded-[13px] bg-danger/12 text-danger">
                      <Siren className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold">{t('trip.emergency')}</p>
                      <p className="mt-0.5 text-[12.5px] text-fg-muted">
                        {t('trip.police')} <span className="font-semibold tabular-nums text-fg">{destination.emergency.police}</span>
                        {' · '}
                        {t('trip.ambulance')} <span className="font-semibold tabular-nums text-fg">{destination.emergency.ambulance}</span>
                        {destination.emergency.tourist && (
                          <>
                            {' · '}
                            {t('trip.touristPolice')} <span className="font-semibold tabular-nums text-fg">{destination.emergency.tourist}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Screen>
  )
}

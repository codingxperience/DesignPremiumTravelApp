import { motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, Clock3, Compass, MapPin, Search, X } from 'lucide-react'
import { SERVICES } from '@/navigation/items'
import { SERVICE_ROUTES } from '@/state/routes'
import { translate } from '@/lib/i18n'
import { DESTINATIONS } from '@/data/destinations'
import { cn } from '@/lib/cn'
import { useI18n, useLiveApp, useNav } from '@/state/store'
import { IconButton } from '@/ui/Button'
import { Chip } from '@/ui/Controls'
import { Img } from '@/ui/Img'
import { EmptyState, SectionHeader } from '@/ui/Misc'
import { EASE_OUT, FLIP_RTL } from '@/ui/motion'
import { Screen } from '@/ui/Screen'

const RECENT = ['cairo', 'makkah', 'istanbul']
const POPULAR = ['zanzibar', 'dubai', 'marrakech', 'maldives', 'capetown', 'sharm']

export function SearchScreen() {
  const live = useLiveApp()
  const { t, L, money } = useI18n()
  const { pop, push, setTab } = useNav()
  const [query, setQuery] = useState('')
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Focus once the push transition has settled, so the keyboard doesn't fight the animation.
    const timer = window.setTimeout(() => input.current?.focus({ preventScroll: true }), 460)
    return () => window.clearTimeout(timer)
  }, [])

  const normalized = query.trim().toLowerCase()
  const results = useMemo(
    () =>
      normalized
        ? DESTINATIONS.filter((d) =>
            [d.name, d.region, ...d.highlights].some((text) => text.en.toLowerCase().includes(normalized) || text.ar.includes(query.trim())),
          )
        : [],
    [normalized, query],
  )

  const services = SERVICES.filter(service => [service.id, translate('en',service.label), translate('ar',service.label),translate('en',service.description),translate('ar',service.description),...(service.id==='egypt'?['Egypt security approval','الموافقة الأمنية لمصر']:[])].some(name => name.toLowerCase().includes(normalized)))
  const header = (
    <div className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink-900/85 px-4 pb-3 pt-[calc(var(--sat)+10px)] backdrop-blur-xl">
      <div className="flex items-center gap-2.5">
        <IconButton label={t('common.back')} onClick={pop}>
          <ChevronLeft className={FLIP_RTL} />
        </IconButton>
        <div className="flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.05] px-3.5 focus-within:border-brand-orange/70">
          <Search className="size-5 shrink-0 text-fg-subtle" aria-hidden />
          <input
            ref={input}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('search.placeholder')}
            aria-label={t('search.placeholder')}
            enterKeyHint="search"
            className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-fg-subtle focus-visible:outline-none"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label={t('search.clear')} className="grid size-7 place-items-center rounded-full bg-white/10 text-fg-muted">
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <Screen header={header} label={t('search.placeholder')}>
      {services.length > 0 && <section className="px-5 pt-5"><h2 className="mb-3 text-sm font-semibold">{t('home.services')}</h2><div className="flex flex-wrap gap-2">{services.map(service => <Chip key={service.id} icon={<service.icon />} onClick={() => push(SERVICE_ROUTES[service.id])}>{t(service.label)}</Chip>)}</div></section>}
      {!normalized && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <SectionHeader title={live ? t('nav.explore') : t('search.recent')} className="mt-6" />
          <div className="mt-3 flex flex-wrap gap-2 px-5">
            {RECENT.map((id) => {
              const destination = DESTINATIONS.find((d) => d.id === id)!
              return (
                <Chip key={id} icon={<Clock3 />} onClick={() => setQuery(L(destination.name))}>
                  {L(destination.name)}
                </Chip>
              )
            })}
          </div>
          <SectionHeader title={t('search.popular')} className="mt-8" />
          <div className="mt-4 grid grid-cols-2 gap-3 px-5">
            {POPULAR.map((id, index) => {
              const destination = DESTINATIONS.find((d) => d.id === id)!
              return (
                <motion.button
                  key={id}
                  type="button"
                  onClick={() => push({ name: 'destination', id })}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: EASE_OUT, delay: index * 0.05 }}
                  className="relative h-[150px] overflow-hidden rounded-[22px] bg-ink-800 text-start"
                >
                  <Img id={destination.image} alt="" width={175} height={150} className="absolute inset-0 size-full" />
                  <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(5,11,23,0.9))]" />
                  <span className="absolute inset-x-3 bottom-3">
                    <span className="block truncate text-[15px] font-semibold text-white">{L(destination.name)}</span>
                    <span className="block truncate text-[12px] text-white/75">{live ? L(destination.region) : t('common.fromPrice', { price: money(destination.priceFrom) })}</span>
                  </span>
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      )}

      {normalized && results.length > 0 && (
        <div className="pt-4">
          <p className="px-5 text-[12.5px] font-medium text-fg-subtle">{t('search.results')}</p>
          <ul className="mt-2">
            {results.map((destination) => (
              <li key={destination.id}>
                <button
                  type="button"
                  onClick={() => push({ name: 'destination', id: destination.id })}
                  className="flex w-full items-center gap-3.5 px-5 py-3 text-start transition-colors hover:bg-white/[0.03]"
                >
                  <span className="block size-14 shrink-0 overflow-hidden rounded-[16px] bg-ink-700">
                    <Img id={destination.image} alt="" width={56} height={56} className="size-full" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15.5px] font-semibold">{L(destination.name)}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-[12.5px] text-fg-muted">
                      <MapPin className="size-3.5" aria-hidden />
                      <span className="truncate">{L(destination.region)}</span>
                    </span>
                  </span>
                  <span className={cn('text-end text-[13px] font-semibold')}>{live ? '›' : money(destination.priceFrom)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {normalized && results.length === 0 && services.length === 0 && (
        <EmptyState
          icon={<Compass />}
          title={t('search.empty.title')}
          body={t('search.empty.body')}
          action={t('search.empty.cta')}
          onAction={() => setTab('support')}
        />
      )}
    </Screen>
  )
}

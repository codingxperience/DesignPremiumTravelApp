import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { Plane, PlaneTakeoff, SlidersHorizontal } from 'lucide-react'
import { getAirport } from '@/data/airports'
import { bestScore, cheapestPrice, farePrice, searchFlights } from '@/data/flights'
import type { FlightQuery } from '@/data/types'
import { cn } from '@/lib/cn'
import { addDays, daysBetween, fromIso, TODAY_ISO } from '@/lib/dates'
import { useI18n, useNav } from '@/state/store'
import { Sheet } from '@/ui/Overlay'
import { Button, IconButton } from '@/ui/Button'
import { Chip } from '@/ui/Controls'
import { EmptyState } from '@/ui/Misc'
import { EASE_OUT, FLIP_RTL } from '@/ui/motion'
import { Screen, ScreenHeader } from '@/ui/Screen'
import { cabinKey, FlightCard } from './parts'

type Sort = 'best' | 'cheapest' | 'fastest'

function Searching() {
  const { t } = useI18n()
  return (
    <div aria-live="polite" aria-busy="true">
      <div className="flex flex-col items-center py-6">
        <svg viewBox="0 0 220 70" className="h-[70px] w-[220px]" aria-hidden>
          <path d="M10 60 Q110 -10 210 60" fill="none" stroke="rgba(255,255,255,0.16)" strokeDasharray="3 6" />
          <circle cx="10" cy="60" r="3.5" fill="#7a89a5" />
          <circle cx="210" cy="60" r="3.5" fill="#f36324" />
        </svg>
        <motion.div
          aria-hidden
          className="-mt-[58px] text-orange-300"
          animate={{ x: [-96, 96], y: [26, -8, 26], rotate: [-25, 0, 25] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', times: [0, 0.5, 1] }}
        >
          <Plane className="size-5 rotate-45" />
        </motion.div>
        <p className="mt-9 text-[14px] font-medium text-fg-muted">{t('flights.searching')}</p>
      </div>
      <div className="space-y-3.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[188px] rounded-[24px] border border-white/[0.05] skeleton" />
        ))}
      </div>
    </div>
  )
}

export function FlightResultsScreen({ query }: { query: FlightQuery }) {
  const { t, tp, L, date, money, range, num } = useI18n()
  const { push, pop } = useNav()
  const [day, setDay] = useState(query.depart)
  const [sort, setSort] = useState<Sort>('best')
  const [directOnly, setDirectOnly] = useState(false)
  const [filters,setFilters]=useState(false)
  const [carrier,setCarrier]=useState(''),[period,setPeriod]=useState('any')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const timer = window.setTimeout(() => setLoading(false), 1100)
    return () => window.clearTimeout(timer)
  }, [day])

  const tripLength = query.ret ? daysBetween(query.depart, query.ret) : 0
  const active: FlightQuery = useMemo(
    () => ({ ...query, depart: day, ret: query.ret ? addDays(day, tripLength) : undefined }),
    [query, day, tripLength],
  )
  const flights = useMemo(() => searchFlights(active), [active])

  const ranked = useMemo(() => {
    const filtered=flights.filter(f=>{
      const hour=Number(f.dep.slice(0,2))
      return (!directOnly || f.stops===0) && (!carrier || f.airline.code===carrier) && (period==='any' || (hour<12?'morning':hour<18?'afternoon':'evening')===period)
    })
    const sorters: Record<Sort, (a: (typeof flights)[number], b: (typeof flights)[number]) => number> = {
      best: (a, b) => bestScore(a) - bestScore(b),
      cheapest: (a, b) => a.price - b.price,
      fastest: (a, b) => a.durationMin - b.durationMin,
    }
    return [...filtered].sort(sorters[sort])
  }, [flights, directOnly, sort, carrier, period])

  const tags = useMemo(() => {
    if (!flights.length) return {}
    const byPrice = [...flights].sort((a, b) => a.price - b.price)[0]
    const byTime = [...flights].sort((a, b) => a.durationMin - b.durationMin)[0]
    const byScore = [...flights].sort((a, b) => bestScore(a) - bestScore(b))[0]
    const result: Record<string, string[]> = {}
    const add = (id: string, label: string) => (result[id] = [...(result[id] ?? []), label])
    add(byScore.id, t('flights.sort.best'))
    add(byPrice.id, t('flights.sort.cheapest'))
    add(byTime.id, t('flights.sort.fastest'))
    return result
  }, [flights, t])

  const days = useMemo(() => {
    const first = daysBetween(TODAY_ISO, query.depart) > 3 ? addDays(query.depart, -3) : addDays(TODAY_ISO, 1)
    return Array.from({ length: 7 }, (_, i) => addDays(first, i))
  }, [query.depart])

  const travellers = query.adults + query.children + query.infants
  const title = `${L(getAirport(query.from).city)} – ${L(getAirport(query.to).city)}`
  const subtitle = `${active.ret ? range(active.depart, active.ret) : date(active.depart, { day: 'numeric', month: 'short' })} · ${tp('common.travellers', travellers)} · ${t(cabinKey(query.cabin))}`
  const priceNote = query.tripType === 'return' ? t('common.return') : t('common.oneWay')

  return (
    <Screen
      label={title}
      header={
        <ScreenHeader
          title={title}
          subtitle={subtitle}
          actions={
            <IconButton label={L({en:'Flight filters',ar:'تصفية الرحلات'})} onClick={()=>setFilters(true)}>
              <SlidersHorizontal />
            </IconButton>
          }
        />
      }
      className="pb-8"
    >
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pt-2" role="listbox" aria-label={t('flights.depart')}>
        {days.map((iso) => {
          const price = cheapestPrice(query, iso)
          const selected = iso === day
          return (
            <button
              key={iso}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => setDay(iso)}
              className={cn(
                'flex w-[66px] shrink-0 flex-col items-center rounded-[18px] border py-2.5 transition-colors',
                selected ? 'border-brand-orange bg-brand-orange/14' : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]',
              )}
            >
              <span className="text-[11px] font-medium text-fg-subtle">{date(iso, { weekday: 'short' })}</span>
              <span className={cn('text-[17px] font-semibold tabular-nums', selected && 'text-orange-200')}>{num(fromIso(iso).getDate())}</span>
              <span className="text-[11px] font-semibold tabular-nums text-fg-muted">{price ? money(price) : '—'}</span>
            </button>
          )
        })}
      </div>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-5">
        {(['best', 'cheapest', 'fastest'] as Sort[]).map((option) => (
          <Chip key={option} selected={sort === option} onClick={() => setSort(option)}>
            {t(`flights.sort.${option}`)}
          </Chip>
        ))}
        <span className="mx-1 w-px shrink-0 bg-white/10" aria-hidden />
        <Chip selected={directOnly} onClick={() => setDirectOnly(!directOnly)} icon={<PlaneTakeoff className={FLIP_RTL} />}>
          {t('flights.directOnly')}
        </Chip>
      </div>

      <div className="mt-5 px-5">
        <AnimatePresence mode="wait" initial={false}>
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Searching />
            </motion.div>
          ) : ranked.length ? (
            <motion.div key={`results-${day}-${sort}-${directOnly}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="mb-3 text-[12.5px] font-medium text-fg-subtle" aria-live="polite">
                {tp('flights.found', ranked.length)}
              </p>
              <div className="space-y-3.5">
                {ranked.map((flight, index) => (
                  <motion.div
                    key={flight.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: EASE_OUT, delay: index * 0.06 }}
                  >
                    <FlightCard
                      flight={flight}
                      price={farePrice(flight, 'light')}
                      priceNote={priceNote}
                      cabin={query.cabin}
                      tags={tags[flight.id]}
                      onSelect={() => push({ name: 'flightDetails', query: active, flightId: flight.id })}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmptyState icon={<Plane className="rotate-45" />} title={t('flights.empty.title')} body={t('flights.empty.body')} action={t('flights.edit')} onAction={pop} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Sheet open={filters} onClose={()=>setFilters(false)} title={L({en:'Flight filters',ar:'تصفية الرحلات'})} label={L({en:'Flight filters',ar:'تصفية الرحلات'})} footer={<Button block onClick={()=>setFilters(false)}>{t('common.done')}</Button>}>
        <label className="block py-2">{L({en:'Airline',ar:'شركة الطيران'})}<select className="ms-3 rounded-lg bg-ink-800 p-2" value={carrier} onChange={e=>setCarrier(e.target.value)}><option value="">{L({en:'All airlines',ar:'كل الشركات'})}</option>{[...new Map(flights.map(f=>[f.airline.code,f.airline])).values()].map(a=><option key={a.code} value={a.code}>{L(a.name)}</option>)}</select></label>
        <label className="block py-2">{L({en:'Departure time',ar:'وقت المغادرة'})}<select className="ms-3 rounded-lg bg-ink-800 p-2" value={period} onChange={e=>setPeriod(e.target.value)}><option value="any">{L({en:'Any time',ar:'أي وقت'})}</option><option value="morning">00:00–11:59</option><option value="afternoon">12:00–17:59</option><option value="evening">18:00–23:59</option></select></label>
        <label className="flex items-center gap-2 py-3"><input type="checkbox" checked={directOnly} onChange={e=>setDirectOnly(e.target.checked)} />{t('flights.directOnly')}</label>
      </Sheet>
    </Screen>
  )
}

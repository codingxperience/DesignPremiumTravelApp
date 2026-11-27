import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { ArrowRight, CalendarDays, Check, Coffee, Dumbbell, MapPin, Mountain, Sparkles, Star, Users, WavesHorizontal, Wifi, type LucideIcon } from 'lucide-react'
import { HOTEL_CITIES, HOTELS } from '@/data/hotels'
import type { Amenity, Hotel } from '@/data/types'
import { cn } from '@/lib/cn'
import { daysBetween, fromToday } from '@/lib/dates'
import type { TKey } from '@/lib/i18n'
import { useI18n, useLiveApp, useNav } from '@/state/store'
import { Button } from '@/ui/Button'
import { Stepper } from '@/ui/Controls'
import { PickerField } from '@/ui/Field'
import { Img } from '@/ui/Img'
import { Badge, Card, RatingPill } from '@/ui/Misc'
import { Sheet } from '@/ui/Overlay'
import { EASE_OUT, FLIP_RTL } from '@/ui/motion'
import { Screen, ScreenHeader } from '@/ui/Screen'
import { DatesSheet } from '../flights/parts'

const AMENITIES: Record<Amenity, { icon: LucideIcon; label: TKey }> = {
  wifi: { icon: Wifi, label: 'amenity.wifi' },
  pool: { icon: WavesHorizontal, label: 'amenity.pool' },
  breakfast: { icon: Coffee, label: 'amenity.breakfast' },
  spa: { icon: Sparkles, label: 'amenity.spa' },
  view: { icon: Mountain, label: 'amenity.view' },
  gym: { icon: Dumbbell, label: 'amenity.gym' },
}

function HotelCard({ hotel, index, onBook }: { hotel: Hotel; index: number; onBook: () => void }) {
  const live = useLiveApp()
  const { t, L, money, num, lang } = useI18n()
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE_OUT, delay: index * 0.07 }}>
      <Card className="overflow-hidden">
        <div className="relative h-44 bg-ink-800">
          <Img id={hotel.image} alt={L(hotel.name)} width={350} height={176} className="absolute inset-0 size-full" />
          <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,11,23,0.4),transparent_40%,rgba(5,11,23,0.55))]" />
          <div className="absolute inset-x-3 top-3 flex items-start justify-between">
            {!live && <RatingPill rating={hotel.rating} />}
            {hotel.haramDistance && <Badge tone="glass">{t('hotels.fromHaram', { m: num(hotel.haramDistance) })}</Badge>}
          </div>
        </div>
        <div className="p-4">
          {!live && <div className="flex items-center gap-0.5" role="img" aria-label={t('common.ratingAria', { rating: num(hotel.stars) })}>
            {Array.from({ length: hotel.stars }, (_, i) => (
              <Star key={i} className="size-3 fill-warning text-warning" aria-hidden />
            ))}
          </div>}
          <h3 className="mt-1 text-[16.5px] font-semibold leading-snug">{L(hotel.name)}</h3>
          <p className="mt-1 flex items-center gap-1 text-[12.5px] text-fg-muted">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{L(hotel.area)}</span>
          </p>
          <ul className="mt-3.5 flex flex-wrap gap-x-3.5 gap-y-2">
            {hotel.amenities.map((amenity) => {
              const { icon: Icon, label } = AMENITIES[amenity]
              return (
                <li key={amenity} className="flex items-center gap-1.5 text-[12.5px] text-fg-muted">
                  <Icon className="size-4 text-orange-300" />
                  {t(label)}
                </li>
              )
            })}
          </ul>
          <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/[0.06] pt-4">
            {live ? <span className="text-xs text-fg-muted">{lang === 'ar' ? 'السعر عند الطلب' : 'Quote on request'}</span> : <p>
              <span className="text-[20px] font-semibold tabular-nums">{money(hotel.pricePerNight)}</span>
              <span className="text-[12px] text-fg-muted"> / {t('hotels.night')}</span>
            </p>}
            <Button size="sm" onClick={onBook} iconEnd={<ArrowRight className={cn('size-4', FLIP_RTL)} />}>
              {live ? (lang === 'ar' ? 'استفسر' : 'Enquire') : t('hotels.book')}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export function HotelsScreen({ cityId: initialCity }: { cityId?: string }) {
  const { t, tp, L, date } = useI18n()
  const { push } = useNav()
  const [cityId, setCityId] = useState(initialCity ?? 'cairo')
  const [range, setRange] = useState({ start: fromToday(21), end: fromToday(26) })
  const [rooms,setRooms] = useState(1)
  const [adults, setAdults] = useState(2)
  const [sheet, setSheet] = useState<'city' | 'dates' | 'guests' | null>(null)
  const [shown, setShown] = useState(cityId)
  const [loading, setLoading] = useState(false)

  const city = HOTEL_CITIES.find((c) => c.id === cityId)!
  const shownCity = HOTEL_CITIES.find((c) => c.id === shown)!
  const nights = daysBetween(range.start, range.end)
  const fmt = (iso: string) => date(iso, { day: 'numeric', month: 'short' })

  const search = () => {
    setLoading(true)
    window.setTimeout(() => {
      setShown(cityId)
      setLoading(false)
    }, 800)
  }

  return (
    <Screen label={t('hotels.title')} header={<ScreenHeader title={t('hotels.title')} />} className="px-5 pb-10 pt-2">
      <Card className="p-3">
        <PickerField className="w-full" label={t('hotels.destination')} icon={<MapPin />} value={L(city.name)} onClick={() => setSheet('city')} />
        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          <PickerField label={t('hotels.dates')} icon={<CalendarDays />} value={`${fmt(range.start)} – ${fmt(range.end)}`} onClick={() => setSheet('dates')} />
          <PickerField label={t('hotels.guests')} icon={<Users />} value={tp('common.adults', adults)+' · '+tp('booking.rooms', rooms)} onClick={() => setSheet('guests')} />
        </div>
        <Button block size="md" className="mt-3" loading={loading} onClick={search}>
          {t('hotels.search')}
        </Button>
      </Card>

      <div className="mt-8 flex items-end justify-between">
        <h2 className="text-[18px] font-semibold">{t('hotels.results', { city: L(shownCity.name) })}</h2>
        <span className="text-[12.5px] text-fg-subtle">{tp('common.nights', nights)}</span>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="h-[330px] rounded-[24px] skeleton" />
            ))}
          </motion.div>
        ) : (
          <motion.div key={shown} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 space-y-4">
            {HOTELS.filter((hotel) => hotel.cityId === shown).map((hotel, index) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                index={index}
                onBook={() => push({ name: 'booking', item: { kind: 'hotel', hotelId: hotel.id, checkIn: range.start, checkOut: range.end, adults, rooms } })}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={sheet === 'city'} onClose={() => setSheet(null)} title={t('hotels.destination')} label={t('hotels.destination')}>
        <ul>
          {HOTEL_CITIES.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => {
                  setCityId(option.id)
                  setSheet(null)
                }}
                className="flex w-full items-center gap-3.5 py-3 text-start"
              >
                <span className="grid size-11 place-items-center rounded-[14px] bg-white/[0.06]">
                  <MapPin className="size-5 text-orange-300" />
                </span>
                <span className="flex-1 text-[15.5px] font-semibold">{L(option.name)}</span>
                {option.id === cityId && <Check className="size-5 text-brand-orange" />}
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
      <DatesSheet open={sheet === 'dates'} onClose={() => setSheet(null)} mode="range" start={range.start} end={range.end} onApply={(start, end) => end && setRange({ start, end })} />
      <Sheet
        open={sheet === 'guests'}
        onClose={() => setSheet(null)}
        title={t('hotels.guests')}
        label={t('hotels.guests')}
        footer={
          <Button block onClick={() => setSheet(null)}>
            {t('common.done')}
          </Button>
        }
      >
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-[15px] font-semibold">{t('booking.adults')}</p>
            <p className="text-[12.5px] text-fg-subtle">{tp('booking.rooms', rooms)}</p>
          </div>
          <Stepper label={t('booking.adults')} value={adults} min={1} max={9} onChange={n=>{setAdults(n);setRooms(r=>Math.min(r,n))}} />
        </div>
        <div className="flex items-center justify-between py-3"><span>{L({en:'Rooms',ar:'الغرف'})}</span><Stepper label={L({en:'Rooms',ar:'الغرف'})} value={rooms} min={1} max={adults} onChange={setRooms} /></div>
      </Sheet>
    </Screen>
  )
}

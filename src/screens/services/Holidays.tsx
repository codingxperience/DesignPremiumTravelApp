import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { ArrowUpRight, MapPin } from 'lucide-react'
import { getDestination } from '@/data/destinations'
import { getPackage, HOLIDAY_PACKAGE_IDS } from '@/data/packages'
import type { HolidayTheme } from '@/data/types'
import { cn } from '@/lib/cn'
import { useI18n, useNav } from '@/state/store'
import { Chip } from '@/ui/Controls'
import { Heading } from '@/ui/Heading'
import { Img } from '@/ui/Img'
import { Badge } from '@/ui/Misc'
import { EASE_OUT, FLIP_RTL } from '@/ui/motion'
import { Screen, ScreenHeader } from '@/ui/Screen'
import { InclusionList } from '../explore/Destination'

type Filter = 'all' | HolidayTheme
const FILTERS: Filter[] = ['all', 'beach', 'culture', 'cruise', 'nature']

export function HolidaysScreen() {
  const { t, tp, L, money } = useI18n()
  const { push } = useNav()
  const [filter, setFilter] = useState<Filter>('all')
  const packages = HOLIDAY_PACKAGE_IDS.map(getPackage).filter((p) => filter === 'all' || p.theme === filter)

  return (
    <Screen label={t('holidays.title')} header={<ScreenHeader title={t('holidays.title')} />} className="pb-10 pt-2">
      <div className="px-5">
        <Heading as="h2" size="xl">
          {t('holidays.title')}
        </Heading>
        <p className="mt-2 text-[14.5px] leading-relaxed text-fg-muted">{t('holidays.subtitle')}</p>
      </div>
      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto px-5">
        {FILTERS.map((option) => (
          <Chip key={option} selected={filter === option} onClick={() => setFilter(option)}>
            {t(`holidays.filter.${option}`)}
          </Chip>
        ))}
      </div>
      <div className="mt-5 space-y-4 px-5">
        <AnimatePresence mode="popLayout" initial={false}>
          {packages.map((travelPackage, index) => {
            const destination = getDestination(travelPackage.destinationId)
            return (
              <motion.button
                key={travelPackage.id}
                type="button"
                onClick={() => push({ name: 'booking', item: { kind: 'package', packageId: travelPackage.id } })}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.45, ease: EASE_OUT, delay: index * 0.05 }}
                className="block w-full overflow-hidden rounded-[26px] border border-white/[0.07] bg-white/[0.035] text-start"
              >
                <div className="relative h-[200px] bg-ink-800">
                  <Img id={travelPackage.image} alt={L(travelPackage.title)} width={350} height={200} className="absolute inset-0 size-full" />
                  <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,11,23,0.35),transparent_35%,rgba(5,11,23,0.88))]" />
                  <div className="absolute inset-x-4 top-4 flex items-center gap-2">
                    <Badge tone="glass">{tp('common.nights', travelPackage.nights)}</Badge>
                    {travelPackage.tag && <Badge tone="solid">{L(travelPackage.tag)}</Badge>}
                  </div>
                  <div className="absolute inset-x-4 bottom-4">
                    <p className="text-[18px] font-semibold leading-snug text-white">{L(travelPackage.title)}</p>
                    <p className="mt-1 flex items-center gap-1 text-[12.5px] text-white/80">
                      <MapPin className="size-3.5" aria-hidden />
                      {L(destination.region)} · {L(travelPackage.board)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4">
                  <InclusionList includes={travelPackage.includes} className="min-w-0 flex-1" />
                  <div className="shrink-0 text-end">
                    <p className="text-[11px] text-fg-subtle">{t('common.from')}</p>
                    <p className="text-[18px] font-semibold tabular-nums">{money(travelPackage.price)}</p>
                  </div>
                  <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-brand-orange text-ink-950">
                    <ArrowUpRight className={cn('size-[18px]', FLIP_RTL)} />
                  </span>
                </div>
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>
    </Screen>
  )
}

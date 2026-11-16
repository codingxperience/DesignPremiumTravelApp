import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { BadgeCheck, BedDouble, Bus, Check, ChevronLeft, Headset, Plane, Stamp } from 'lucide-react'
import { getPackage, UMRAH_PACKAGE_IDS } from '@/data/packages'
import type { TKey } from '@/lib/i18n'
import { PHOTOS } from '@/lib/images'
import { useAppState, useDispatch, useI18n, useNav, useToast } from '@/state/store'
import { Button, IconButton } from '@/ui/Button'
import { Segmented } from '@/ui/Controls'
import { Heading } from '@/ui/Heading'
import { KaabaIcon } from '@/ui/Icons'
import { Img } from '@/ui/Img'
import { Badge, Card } from '@/ui/Misc'
import { EASE_OUT, FLIP_RTL } from '@/ui/motion'
import { Screen } from '@/ui/Screen'
import { PackageCard } from '../explore/Destination'

const INCLUDED: { icon: typeof Plane; label: TKey }[] = [
  { icon: Plane, label: 'include.flight' },
  { icon: Stamp, label: 'include.visa' },
  { icon: BedDouble, label: 'include.hotel' },
  { icon: Bus, label: 'include.transfer' },
  { icon: Headset, label: 'nav.support' },
]

export function UmrahScreen({ initialTab = 'umrah' }: { initialTab?: 'umrah' | 'hajj' }) {
  const { t, isRtl } = useI18n()
  const { pop, push } = useNav()
  const { hajjRegistered } = useAppState()
  const dispatch = useDispatch()
  const toast = useToast()
  const [tab, setTab] = useState(initialTab)

  return (
    <Screen label={t('umrah.title')} className="pb-10">
      <div className="relative h-[380px] overflow-hidden">
        <Img id={PHOTOS.kaaba} alt={t('umrah.title')} width={390} height={380} priority className="absolute inset-0 size-full" />
        <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,11,23,0.55)_0%,rgba(5,11,23,0.1)_40%,#081226_100%)]" />
        <div className="absolute start-4 top-[calc(var(--sat)+8px)]">
          <IconButton label={t('common.back')} variant="onImage" onClick={pop}>
            <ChevronLeft className={FLIP_RTL} />
          </IconButton>
        </div>
        <div className="absolute inset-x-5 bottom-6">
          <span className="grid size-11 place-items-center rounded-[15px] bg-brand-orange/90 text-ink-950">
            <KaabaIcon className="size-6" />
          </span>
          <Heading as="h1" size="2xl" className="mt-4 text-white">
            {t('umrah.title')}
          </Heading>
          {!isRtl && (
            <p className="mt-1 text-[18px] font-bold text-orange-300" lang="ar" dir="rtl">
              عمرة وحج
            </p>
          )}
          <p className="mt-2 max-w-[310px] text-[14px] leading-relaxed text-white/80">{t('umrah.subtitle')}</p>
        </div>
      </div>

      <div className="px-5">
        <Segmented
          label={t('umrah.title')}
          value={tab}
          onChange={setTab}
          options={[
            { value: 'umrah', label: t('umrah.tab.umrah') },
            { value: 'hajj', label: t('umrah.tab.hajj') },
          ]}
        />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: EASE_OUT }}>
            {tab === 'umrah' ? (
              <>
                <p className="mt-6 text-[13px] font-semibold text-fg-muted">{t('umrah.included')}</p>
                <ul className="mt-3 grid grid-cols-5 gap-2">
                  {INCLUDED.map(({ icon: Icon, label }) => (
                    <li key={label} className="flex flex-col items-center gap-1.5 text-center">
                      <span className="grid size-11 place-items-center rounded-[14px] border border-white/[0.08] bg-white/[0.04] text-orange-300">
                        <Icon className="size-5" />
                      </span>
                      <span className="text-[11px] leading-tight text-fg-muted">{t(label)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 space-y-4">
                  {UMRAH_PACKAGE_IDS.map(getPackage).map((travelPackage) => (
                    <PackageCard
                      key={travelPackage.id}
                      travelPackage={travelPackage}
                      onSelect={() => push({ name: 'booking', item: { kind: 'package', packageId: travelPackage.id } })}
                    />
                  ))}
                </div>
              </>
            ) : (
              <Card className="mt-6 overflow-hidden">
                <div className="relative h-36">
                  <Img id={PHOTOS.nabawiDome} alt="" width={350} height={144} className="absolute inset-0 size-full" />
                  <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(5,11,23,0.8))]" />
                  <Badge tone="glass" className="absolute bottom-3 start-4">
                    {t('hajj.kicker')}
                  </Badge>
                </div>
                <div className="p-5">
                  <h2 className="text-[19px] font-semibold leading-snug">{t('hajj.title')}</h2>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-fg-muted">{t('hajj.body')}</p>
                  <ul className="mt-4 space-y-2.5">
                    {(['hajj.point1', 'hajj.point2', 'hajj.point3'] as TKey[]).map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-[13.5px]">
                        <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success/15 text-success">
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                        {t(point)}
                      </li>
                    ))}
                  </ul>
                  {hajjRegistered ? (
                    <div className="mt-5 flex h-14 items-center justify-center gap-2 rounded-[18px] bg-success/12 text-[15px] font-semibold text-success">
                      <BadgeCheck className="size-5" />
                      {t('hajj.done')}
                    </div>
                  ) : (
                    <Button
                      block
                      className="mt-5"
                      onClick={() => {
                        dispatch({ type: 'REGISTER_HAJJ' })
                        toast(t('hajj.registered'))
                      }}
                    >
                      {t('hajj.register')}
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Screen>
  )
}

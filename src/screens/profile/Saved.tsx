import { motion } from 'motion/react'
import { Bookmark, MapPin } from 'lucide-react'
import { DESTINATIONS } from '@/data/destinations'
import { useAppState, useI18n, useNav } from '@/state/store'
import { Img } from '@/ui/Img'
import { EmptyState } from '@/ui/Misc'
import { EASE_OUT } from '@/ui/motion'
import { Screen, ScreenHeader } from '@/ui/Screen'
import { SaveButton } from '../explore/shared'

export function SavedScreen() {
  const { t, L, money } = useI18n()
  const { saved } = useAppState()
  const { push, reset } = useNav()
  const destinations = DESTINATIONS.filter((d) => saved.includes(d.id))

  return (
    <Screen label={t('saved.title')} header={<ScreenHeader title={t('saved.title')} />} className="px-5 pb-10 pt-2">
      {destinations.length === 0 ? (
        <EmptyState icon={<Bookmark />} title={t('saved.empty.title')} body={t('saved.empty.body')} action={t('saved.empty.cta')} onAction={() => reset('explore')} />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {destinations.map((destination, index) => (
            <motion.article
              key={destination.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE_OUT, delay: index * 0.05 }}
              className="relative h-[230px] overflow-hidden rounded-[24px] bg-ink-800"
            >
              <Img id={destination.image} alt={L(destination.name)} width={175} height={230} className="absolute inset-0 size-full" />
              <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(5,11,23,0.92))]" />
              <button type="button" onClick={() => push({ name: 'destination', id: destination.id })} className="absolute inset-0 z-[1]" aria-label={t('home.open', { name: L(destination.name) })} />
              <div className="absolute end-2.5 top-2.5 z-[2]">
                <SaveButton id={destination.id} name={L(destination.name)} />
              </div>
              <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[2]">
                <p className="truncate text-[15px] font-semibold text-white">{L(destination.name)}</p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-[11.5px] text-white/75">
                  <MapPin className="size-3 shrink-0" aria-hidden />
                  {L(destination.region)}
                </p>
                <p className="mt-1 text-[12.5px] font-semibold text-white">{t('common.fromPrice', { price: money(destination.priceFrom) })}</p>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </Screen>
  )
}

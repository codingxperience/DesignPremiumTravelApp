import { motion } from 'motion/react'
import { ArrowUpRight, Bookmark, MapPin } from 'lucide-react'
import type { Destination } from '@/data/types'
import { cn } from '@/lib/cn'
import { useAppState, useDispatch, useI18n, useToast } from '@/state/store'
import { Img } from '@/ui/Img'
import { RatingPill } from '@/ui/Misc'
import { EASE_OUT, FLIP_RTL } from '@/ui/motion'

export function SaveButton({ id, name, size = 'md', className }: { id: string; name: string; size?: 'md' | 'lg'; className?: string }) {
  const { saved } = useAppState()
  const dispatch = useDispatch()
  const toast = useToast()
  const { t } = useI18n()
  const isSaved = saved.includes(id)
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.86 }}
      aria-pressed={isSaved}
      aria-label={isSaved ? t('common.unsave.aria', { name }) : t('common.save.aria', { name })}
      onClick={() => {
        dispatch({ type: 'TOGGLE_SAVED', id })
        toast(isSaved ? t('common.removed') : t('common.saved'))
      }}
      className={cn('glass-dark grid place-items-center rounded-full text-white', size === 'lg' ? 'size-11' : 'size-10', className)}
    >
      <motion.span key={String(isSaved)} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
        <Bookmark className={cn('size-[18px]', isSaved && 'fill-brand-orange text-brand-orange')} />
      </motion.span>
    </motion.button>
  )
}

export function Avatar({ id, alt, className }: { id: string; alt: string; className?: string }) {
  return (
    <span className={cn('relative block shrink-0 overflow-hidden rounded-full bg-ink-700', className)}>
      <Img id={id} alt={alt} width={96} height={96} crop="faces" className="size-full" />
    </span>
  )
}

/** Tall photographic card used in the recommended carousel. */
export function DestinationCard({
  destination,
  kicker,
  index,
  onOpen,
}: {
  destination: Destination
  kicker: string
  index: number
  onOpen: () => void
}) {
  const { t, L, money, isRtl } = useI18n()
  const name = L(destination.name)
  return (
    <motion.article
      initial={{ opacity: 0, x: isRtl ? -28 : 28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, ease: EASE_OUT, delay: index * 0.07 }}
      className="relative h-[316px] w-[230px] shrink-0 snap-start overflow-hidden rounded-[28px] bg-ink-800 shadow-[0_24px_40px_-24px_rgba(0,0,0,0.9)]"
    >
      <Img id={destination.image} alt={name} width={230} height={316} className="absolute inset-0 size-full" />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,11,23,0.45)_0%,rgba(5,11,23,0)_28%,rgba(5,11,23,0)_42%,rgba(5,11,23,0.94)_100%)]"
      />
      <button type="button" onClick={onOpen} aria-label={t('home.open', { name })} className="absolute inset-0 z-[1] rounded-[28px]" />
      <div className="pointer-events-none absolute inset-x-3.5 top-3.5 z-[2] flex items-start justify-between">
        <RatingPill rating={destination.rating} />
        <SaveButton id={destination.id} name={name} className="pointer-events-auto" />
      </div>
      <div className="pointer-events-none absolute inset-x-4 bottom-4 z-[2]">
        <p className="overline text-white/70">{kicker}</p>
        <h3 className="heading mt-2 text-[24px] leading-[1.04] text-white rtl:text-[22px] rtl:leading-[1.35]">{name}</h3>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[12.5px] text-white/80">
              <MapPin className="size-3.5" aria-hidden />
              <span className="truncate">{L(destination.region)}</span>
            </p>
            <p className="mt-1 text-[13px] font-semibold text-white">{t('common.fromPrice', { price: money(destination.priceFrom) })}</p>
          </div>
          <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-white text-ink-950">
            <ArrowUpRight className={cn('size-[18px]', FLIP_RTL)} />
          </span>
        </div>
      </div>
    </motion.article>
  )
}

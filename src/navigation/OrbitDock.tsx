import { motion } from 'motion/react'
import { X } from 'lucide-react'
import { GlobeGlyph } from '@/brand/Logo'
import { cn } from '@/lib/cn'
import { useAppState, useI18n, useNav } from '@/state/store'
import { SPRING } from '@/ui/motion'
import { TABS, useTabBadges } from './items'

/** Concept 01 — floating glass dock with the Cross World globe as a raised launcher. */
export function OrbitDock() {
  const { tab, servicesOpen } = useAppState()
  const { setTab, openServices } = useNav()
  const { t } = useI18n()
  const badges = useTabBadges()

  const renderTab = (item: (typeof TABS)[number]) => {
    const active = tab === item.id
    const Icon = item.icon
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => setTab(item.id)}
        aria-current={active ? 'page' : undefined}
        className="group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1"
      >
        <span
          className={cn(
            'relative grid h-8 w-[52px] place-items-center rounded-full transition-colors duration-300',
            active ? 'bg-white/[0.11] text-fg' : 'text-fg-subtle group-hover:text-fg-muted',
          )}
        >
          <motion.span initial={false} animate={{ scale: active ? 1 : 0.92 }} transition={SPRING} className="grid place-items-center">
            <Icon className="size-[21px]" />
          </motion.span>
          {badges[item.id] && <span aria-hidden className="absolute end-3 top-1 size-2 rounded-full bg-brand-orange ring-2 ring-ink-800" />}
        </span>
        <span className={cn('max-w-full truncate text-[10.5px] font-semibold transition-colors duration-300', active ? 'text-fg' : 'text-fg-subtle')}>
          {t(item.label)}
        </span>
      </button>
    )
  }

  return (
    <nav aria-label={t('nav.primary')} className="absolute inset-x-4 bottom-[calc(var(--sab)+6px)] z-40">
      <div className="glass relative flex h-[70px] items-stretch rounded-[28px] px-1.5 shadow-[0_24px_50px_-18px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.07)]">
        {TABS.slice(0, 2).map(renderTab)}
        <div className="w-[82px] shrink-0" aria-hidden />
        {TABS.slice(2).map(renderTab)}
      </div>

      <motion.button
        type="button"
        onClick={() => openServices(!servicesOpen)}
        aria-label={servicesOpen ? t('nav.closeServices') : t('nav.openServices')}
        aria-expanded={servicesOpen}
        aria-haspopup="dialog"
        whileTap={{ scale: 0.92 }}
        className="absolute left-1/2 top-0 size-[64px] -translate-x-1/2 -translate-y-[34%] rounded-full"
      >
        <span aria-hidden className="absolute -inset-[6px] rounded-full bg-ink-900/40 ring-1 ring-white/10 backdrop-blur-md" />
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_24%,#ffa06a_0%,#f36324_52%,#c2470f_100%)] shadow-[0_16px_30px_-10px_rgba(243,99,36,0.95),inset_0_1px_0_rgba(255,255,255,0.4)]"
        />
        <motion.span
          aria-hidden
          className="absolute inset-0 grid place-items-center text-white"
          initial={false}
          animate={{ rotate: servicesOpen ? 90 : 0, scale: servicesOpen ? 0.4 : 1, opacity: servicesOpen ? 0 : 1 }}
          transition={SPRING}
        >
          <GlobeGlyph className="size-[30px] drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]" />
        </motion.span>
        <motion.span
          aria-hidden
          className="absolute inset-0 grid place-items-center text-ink-950"
          initial={false}
          animate={{ rotate: servicesOpen ? 0 : -90, scale: servicesOpen ? 1 : 0.4, opacity: servicesOpen ? 1 : 0 }}
          transition={SPRING}
        >
          <X className="size-7" strokeWidth={2.25} />
        </motion.span>
      </motion.button>
    </nav>
  )
}

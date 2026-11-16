import { motion } from 'motion/react'
import { Plane } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAppState, useI18n, useNav } from '@/state/store'
import { FLIP_RTL } from '@/ui/motion'
import { TABS, useTabBadges } from './items'

/** Concept 02 — a compact pill; the active tab expands to show its label, booking sits on its own button. */
export function CapsuleNav() {
  const { tab, servicesOpen } = useAppState()
  const { setTab, openServices } = useNav()
  const { t } = useI18n()
  const badges = useTabBadges()

  return (
    <nav aria-label={t('nav.primary')} className="absolute inset-x-0 bottom-[calc(var(--sab)+8px)] z-40 flex items-center justify-center gap-2.5 px-4">
      <div className="glass flex items-center gap-1 rounded-full p-1.5 shadow-[0_24px_50px_-18px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.07)]">
        {TABS.map((item) => {
          const active = tab === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex h-12 items-center rounded-full px-3.5 transition-[background-color,color] duration-300 ease-ios',
                active ? 'bg-white text-ink-950' : 'text-fg-muted hover:text-fg',
              )}
            >
              <Icon className="size-[21px]" />
              <span
                className="grid transition-[grid-template-columns] duration-[400ms] ease-ios"
                style={{ gridTemplateColumns: active ? '1fr' : '0fr' }}
              >
                <span className={cn('overflow-hidden whitespace-nowrap text-[13px] font-semibold transition-opacity duration-300', active ? 'ps-2 opacity-100' : 'opacity-0')}>
                  {t(item.label)}
                </span>
              </span>
              {badges[item.id] && !active && (
                <span aria-hidden className="absolute end-2.5 top-2.5 size-2 rounded-full bg-brand-orange ring-2 ring-ink-800" />
              )}
            </button>
          )
        })}
      </div>
      <motion.button
        type="button"
        onClick={() => openServices(!servicesOpen)}
        aria-label={t('nav.openServices')}
        aria-expanded={servicesOpen}
        aria-haspopup="dialog"
        whileTap={{ scale: 0.92 }}
        className="grid size-[60px] shrink-0 place-items-center rounded-full bg-brand-orange text-ink-950 shadow-[0_16px_30px_-12px_rgba(243,99,36,0.95),inset_0_1px_0_rgba(255,255,255,0.35)]"
      >
        <Plane className={cn('size-6', FLIP_RTL)} />
      </motion.button>
    </nav>
  )
}

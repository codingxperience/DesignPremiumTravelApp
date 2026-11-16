import { motion } from 'motion/react'
import { PlaneTakeoff } from 'lucide-react'
import type { CSSProperties } from 'react'
import { cn } from '@/lib/cn'
import { useAppState, useI18n, useNav } from '@/state/store'
import { FLIP_RTL, SPRING } from '@/ui/motion'
import { TABS, useTabBadges } from './items'

const STUB = 86
const NOTCH = 9

/** Cuts two half-circle notches at `x`, top and bottom, like the tear line of a boarding pass. */
function notchMask(x: string): CSSProperties {
  const mask = [
    `radial-gradient(circle ${NOTCH}px at ${x} 0, transparent 97%, #000 100%) top / 100% 51% no-repeat`,
    `radial-gradient(circle ${NOTCH}px at ${x} 100%, transparent 97%, #000 100%) bottom / 100% 51% no-repeat`,
  ].join(', ')
  return { mask, WebkitMask: mask }
}

/** Concept 03 — a boarding-pass bar: tabs live on the pass, booking is the tear-off stub. */
export function TicketNav() {
  const { tab, servicesOpen } = useAppState()
  const { setTab, openServices } = useNav()
  const { t, isRtl } = useI18n()
  const badges = useTabBadges()
  const index = TABS.findIndex((item) => item.id === tab)

  return (
    <nav aria-label={t('nav.primary')} className="absolute inset-x-3 bottom-[calc(var(--sab)+6px)] z-40 drop-shadow-[0_22px_30px_rgba(0,0,0,0.55)]">
      <div className="relative h-[68px]">
        <div
          aria-hidden
          className="glass absolute inset-0 rounded-[22px]"
          style={notchMask(isRtl ? `${STUB}px` : `calc(100% - ${STUB}px)`)}
        />
        <div className="relative flex h-full" style={{ paddingInlineEnd: STUB }}>
          <motion.span
            aria-hidden
            className="absolute top-0 h-[3px] rounded-b-full bg-brand-orange shadow-[0_0_12px_rgba(243,99,36,0.9)]"
            style={{ width: `calc((100% - ${STUB}px) / ${TABS.length})`, insetInlineStart: 0 }}
            initial={false}
            animate={{ x: `${(isRtl ? -1 : 1) * index * 100}%`, opacity: index < 0 ? 0 : 1 }}
            transition={SPRING}
          />
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
                  'relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 transition-colors duration-300',
                  active ? 'text-fg' : 'text-fg-subtle hover:text-fg-muted',
                )}
              >
                <span className="relative">
                  <Icon className="size-[21px]" />
                  {badges[item.id] && <span aria-hidden className="absolute -end-1 -top-0.5 size-2 rounded-full bg-brand-orange ring-2 ring-ink-800" />}
                </span>
                <span className="max-w-full truncate text-[10.5px] font-semibold">{t(item.label)}</span>
              </button>
            )
          })}
        </div>
        <span
          aria-hidden
          className="absolute inset-y-3.5 border-s-[1.5px] border-dashed border-white/25"
          style={{ insetInlineEnd: STUB }}
        />
        <motion.button
          type="button"
          onClick={() => openServices(!servicesOpen)}
          aria-label={t('nav.openServices')}
          aria-expanded={servicesOpen}
          aria-haspopup="dialog"
          whileTap={{ scale: 0.96 }}
          className="absolute inset-y-0 end-0 flex flex-col items-center justify-center gap-1 rounded-e-[22px] bg-brand-orange text-ink-950"
          style={{ width: STUB, ...notchMask(isRtl ? '100%' : '0') }}
        >
          <PlaneTakeoff className={cn('size-[22px]', FLIP_RTL)} />
          <span className="text-[11px] font-bold uppercase tracking-[0.12em]">{t('nav.book')}</span>
          <span aria-hidden className="mt-0.5 flex h-2 items-end gap-[2px] opacity-60">
            {[3, 1, 2, 1, 3, 2, 1, 2, 3, 1].map((w, i) => (
              <span key={i} className="h-full bg-ink-950" style={{ width: w }} />
            ))}
          </span>
        </motion.button>
      </div>
    </nav>
  )
}

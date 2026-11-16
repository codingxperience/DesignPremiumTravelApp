import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { BottomNav } from '@/navigation/BottomNav'
import type { Tab } from '@/state/routes'
import { useAppState, useI18n } from '@/state/store'
import { PAGE_TRANSITION } from '@/ui/motion'
import { RouteView, TabView } from './RouteView'

const TAB_ORDER: Tab[] = ['explore', 'trips', 'support', 'profile']

/** Tab screens mount on first visit and then stay mounted, so each keeps its scroll position. */
function TabRoots() {
  const { tab } = useAppState()
  const [visited, setVisited] = useState<Tab[]>([tab])

  useEffect(() => {
    setVisited((current) => (current.includes(tab) ? current : [...current, tab]))
  }, [tab])

  return (
    <>
      {TAB_ORDER.filter((id) => id === tab || visited.includes(id)).map((id) => {
        const active = id === tab
        return (
          <motion.div
            key={id}
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.985 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            style={{ pointerEvents: active ? 'auto' : 'none', zIndex: active ? 1 : 0 }}
            inert={!active}
          >
            <TabView tab={id} />
          </motion.div>
        )
      })}
    </>
  )
}

/**
 * Stack navigation: pushed screens slide in from the reading direction while
 * the screen beneath recedes, mirroring iOS (and reversing for Arabic).
 */
export function Navigator() {
  const { stack } = useAppState()
  const { isRtl } = useI18n()
  const depth = stack.length
  const offset = (percent: number) => `${isRtl ? -percent : percent}%`

  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{ x: depth ? offset(-26) : '0%', opacity: depth ? 0.45 : 1 }}
        transition={PAGE_TRANSITION}
        inert={depth > 0}
      >
        <TabRoots />
      </motion.div>

      <AnimatePresence initial={false}>
        {stack.map((entry, index) => {
          const isTop = index === depth - 1
          return (
            <motion.div
              key={entry.key}
              className="absolute inset-0 bg-ink-900 ltr:shadow-[-24px_0_48px_-12px_rgba(0,0,0,0.6)] rtl:shadow-[24px_0_48px_-12px_rgba(0,0,0,0.6)]"
              style={{ zIndex: 10 + index }}
              initial={{ x: offset(100) }}
              animate={{ x: isTop ? '0%' : offset(-26), opacity: isTop ? 1 : 0.45 }}
              exit={{ x: offset(100), opacity: 1 }}
              transition={PAGE_TRANSITION}
              inert={!isTop}
            >
              <RouteView route={entry.route} />
            </motion.div>
          )
        })}
      </AnimatePresence>

      <BottomNav visible={depth === 0} />
    </div>
  )
}

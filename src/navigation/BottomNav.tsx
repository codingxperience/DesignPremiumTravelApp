import { AnimatePresence, motion } from 'motion/react'
import { useAppState } from '@/state/store'
import { EASE_IOS } from '@/ui/motion'
import { CapsuleNav } from './CapsuleNav'
import { OrbitDock } from './OrbitDock'
import { ServicesOrbit } from './ServicesOrbit'
import { ServicesSheet } from './ServicesSheet'
import { TicketNav } from './TicketNav'

const NAVS = { orbit: OrbitDock, capsule: CapsuleNav, ticket: TicketNav }

/** Space every tab screen keeps free at the bottom so content clears the floating bar. */
export const TAB_BAR_SPACE = 120

export function BottomNav({ visible }: { visible: boolean }) {
  const { navStyle } = useAppState()
  const Nav = NAVS[navStyle]
  return (
    <>
      <AnimatePresence initial={false} mode="popLayout">
        {visible && (
          <motion.div
            key={navStyle}
            className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-0 [&_nav]:pointer-events-auto"
            initial={{ y: 130, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 130, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE_IOS }}
          >
            <Nav />
          </motion.div>
        )}
      </AnimatePresence>
      {navStyle === 'orbit' ? <ServicesOrbit /> : <ServicesSheet />}
    </>
  )
}

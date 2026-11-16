import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { Check } from 'lucide-react'
import { useAppState, useDispatch } from '@/state/store'
import { EASE_OUT } from './motion'

export function ToastHost() {
  const { toast } = useAppState()
  const dispatch = useDispatch()

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => dispatch({ type: 'TOAST_CLEAR', id: toast.id }), 2600)
    return () => window.clearTimeout(timer)
  }, [toast, dispatch])

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute inset-x-0 top-[calc(var(--sat)+6px)] z-[90] flex justify-center px-6"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ y: -20, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -14, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="glass flex max-w-full items-center gap-2.5 rounded-full py-2.5 pe-4 ps-2.5 text-[13.5px] font-medium shadow-[0_18px_40px_-18px_rgba(0,0,0,0.8)]"
          >
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-orange text-ink-950">
              <Check className="size-3.5" strokeWidth={3} />
            </span>
            <span className="truncate">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

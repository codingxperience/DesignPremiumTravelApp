import { AnimatePresence, motion, useDragControls } from 'motion/react'
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useI18n } from '@/state/store'
import { IconButton } from './Button'
import { SHEET_SPRING } from './motion'

const OverlayContext = createContext<HTMLElement | null>(null)

/** Renders a layer inside the phone screen that sheets and dialogs portal into. */
export function OverlayRoot({ children }: { children: ReactNode }) {
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  return (
    <OverlayContext.Provider value={element}>
      {children}
      <div ref={setElement} className="pointer-events-none absolute inset-0 z-[60] [&>*]:pointer-events-auto" />
    </OverlayContext.Provider>
  )
}

function useEscape(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onEscape()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [active, onEscape])
}

/** Moves focus into an opened layer and restores it to the trigger on close. */
export function useFocusReturn(open: boolean) {
  const target = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const frame = requestAnimationFrame(() => target.current?.focus({ preventScroll: true }))
    return () => {
      cancelAnimationFrame(frame)
      previous?.focus?.({ preventScroll: true })
    }
  }, [open])
  return target
}

type SheetProps = {
  open: boolean
  onClose: () => void
  title?: ReactNode
  label: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function Sheet({ open, onClose, title, label, children, footer, className }: SheetProps) {
  const root = useContext(OverlayContext)
  const { t } = useI18n()
  const controls = useDragControls()
  const panel = useFocusReturn(open)
  useEscape(open, onClose)

  if (!root) return null
  return createPortal(
    <AnimatePresence>
      {open && (
        <div key="sheet" className="absolute inset-0" role="dialog" aria-modal="true" aria-label={label}>
          <motion.div
            className="absolute inset-0 bg-ink-950/65 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            ref={panel}
            tabIndex={-1}
            className={cn(
              'absolute inset-x-0 bottom-0 flex max-h-[90%] flex-col rounded-t-[32px] border-t border-white/10 bg-ink-850 shadow-[0_-30px_60px_-24px_rgba(0,0,0,0.7)] outline-none',
              className,
            )}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={SHEET_SPRING}
            drag="y"
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 700) onClose()
            }}
          >
            <div className="shrink-0 cursor-grab touch-none pb-2 pt-3 active:cursor-grabbing" onPointerDown={(event) => controls.start(event)}>
              <div className="mx-auto h-1.5 w-10 rounded-full bg-white/20" />
              {title && (
                <div className="flex items-center justify-between gap-3 px-5 pt-3">
                  <h2 className="text-[18px] font-semibold tracking-[-0.01em]">{title}</h2>
                  <IconButton label={t('common.close')} size="sm" onClick={onClose} onPointerDown={(event) => event.stopPropagation()}>
                    <X />
                  </IconButton>
                </div>
              )}
            </div>
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-1">{children}</div>
            {footer ? (
              <div className="shrink-0 border-t border-white/[0.07] px-5 pb-[calc(var(--sab)+12px)] pt-3.5">{footer}</div>
            ) : (
              <div className="h-[var(--sab)] shrink-0" />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    root,
  )
}

/** Portal for full-screen overlays (services launcher, processing states). */
export function OverlayPortal({ children }: { children: ReactNode }) {
  const root = useContext(OverlayContext)
  return root ? createPortal(children, root) : null
}

export { useEscape }

import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useI18n, useNav } from '@/state/store'
import { IconButton } from './Button'
import { FLIP_RTL } from './motion'

const ScrollContext = createContext<{ scrollY: MotionValue<number>; container: RefObject<HTMLDivElement | null> } | null>(null)

export function useScreenScroll() {
  const context = useContext(ScrollContext)
  if (!context) throw new Error('useScreenScroll must be used inside Screen')
  return context
}

export function useElementHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [height, setHeight] = useState(0)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(() => setHeight(element.offsetHeight))
    observer.observe(element)
    setHeight(element.offsetHeight)
    return () => observer.disconnect()
  }, [])
  return [ref, height] as const
}

type ScreenProps = {
  children: ReactNode
  header?: ReactNode
  footer?: ReactNode
  className?: string
  /** Extra space reserved at the bottom (for example, under a floating tab bar). */
  bottomInset?: number
  label?: string
}

/** A full-height scrolling screen with an optional sticky header and floating footer. */
export function Screen({ children, header, footer, className, bottomInset = 0, label }: ScreenProps) {
  const container = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll({ container })
  const [footerRef, footerHeight] = useElementHeight<HTMLDivElement>()

  return (
    <ScrollContext.Provider value={{ scrollY, container }}>
      <section aria-label={label} className="absolute inset-0 overflow-hidden bg-ink-900">
        <div ref={container} className="no-scrollbar absolute inset-0 overflow-y-auto overscroll-contain">
          {header}
          <div className={className} style={{ paddingBottom: footerHeight + bottomInset }}>
            {children}
          </div>
        </div>
        {footer && (
          <div ref={footerRef} className="absolute inset-x-0 bottom-0 z-30">
            {footer}
          </div>
        )}
      </section>
    </ScrollContext.Provider>
  )
}

type ScreenHeaderProps = {
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  onBack?: () => void
  hideBack?: boolean
  /** Large title shown below the bar, collapsing into the bar as the screen scrolls. */
  largeTitle?: ReactNode
}

export function ScreenHeader({ title, subtitle, actions, onBack, hideBack, largeTitle }: ScreenHeaderProps) {
  const { t } = useI18n()
  const { pop } = useNav()
  const { scrollY } = useScreenScroll()
  const backdrop = useTransform(scrollY, [0, 28], [0, 1])
  const compactTitle = useTransform(scrollY, largeTitle ? [36, 64] : [0, 1], largeTitle ? [0, 1] : [1, 1])

  return (
    <>
      <header className="sticky top-0 z-30">
        <motion.div
          aria-hidden
          style={{ opacity: backdrop }}
          className="absolute inset-0 border-b border-white/[0.06] bg-ink-900/80 backdrop-blur-xl backdrop-saturate-150"
        />
        <div className="relative grid h-[calc(var(--sat)+56px)] grid-cols-[96px_1fr_96px] items-end px-4 pb-1.5">
          <div className="flex h-11 items-center">
            {!hideBack && (
              <IconButton label={t('common.back')} onClick={onBack ?? pop}>
                <ChevronLeft className={FLIP_RTL} />
              </IconButton>
            )}
          </div>
          <motion.div style={{ opacity: compactTitle }} className="flex h-11 min-w-0 flex-col items-center justify-center text-center">
            {title && <h1 className="w-full truncate text-[16px] font-semibold tracking-[-0.01em]">{title}</h1>}
            {subtitle && <p className="w-full truncate text-[12px] text-fg-muted">{subtitle}</p>}
          </motion.div>
          <div className="flex h-11 items-center justify-end gap-2">{actions}</div>
        </div>
      </header>
      {largeTitle && <div className="px-5 pb-2 pt-1">{largeTitle}</div>}
    </>
  )
}

/** Glass footer bar that floats above scrolling content. */
export function StickyFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'border-t border-white/[0.07] bg-ink-900/80 px-5 pb-[calc(var(--sab)+12px)] pt-3.5 backdrop-blur-xl backdrop-saturate-150',
        className,
      )}
    >
      {children}
    </div>
  )
}

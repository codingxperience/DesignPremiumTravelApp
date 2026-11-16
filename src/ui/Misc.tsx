import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useI18n } from '@/state/store'
import { Button } from './Button'

const BADGE_TONES = {
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/12 text-warning',
  orange: 'bg-brand-orange/15 text-orange-300',
  neutral: 'bg-white/[0.07] text-fg-muted',
  sky: 'bg-sky/12 text-sky',
  solid: 'bg-brand-orange text-ink-950',
  glass: 'glass-dark text-white',
  successOnImage: 'bg-ink-950/65 text-success backdrop-blur-md',
  warningOnImage: 'bg-ink-950/65 text-warning backdrop-blur-md',
}

export function Badge({
  tone = 'neutral',
  dot,
  children,
  className,
}: {
  tone?: keyof typeof BADGE_TONES
  dot?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[11.5px] font-semibold [&_svg]:size-3.5',
        BADGE_TONES[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  )
}

export function SectionHeader({
  title,
  action,
  onAction,
  className,
}: {
  title: ReactNode
  action?: string
  onAction?: () => void
  className?: string
}) {
  return (
    <div className={cn('flex items-end justify-between gap-4 px-5', className)}>
      <h2 className="text-[18px] font-semibold tracking-[-0.01em]">{title}</h2>
      {action && (
        <button type="button" onClick={onAction} className="shrink-0 text-[13px] font-semibold text-orange-300 transition-colors hover:text-orange-200">
          {action}
        </button>
      )}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  onAction,
}: {
  icon: ReactNode
  title: string
  body: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center px-8 py-14 text-center">
      <div className="relative grid size-20 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-orange-300 [&_svg]:size-8">
        <span className="absolute inset-[-10px] rounded-full border border-white/[0.05]" aria-hidden />
        {icon}
      </div>
      <h3 className="mt-6 text-[18px] font-semibold">{title}</h3>
      <p className="mt-2 max-w-[260px] text-[14px] leading-relaxed text-fg-muted">{body}</p>
      {action && (
        <Button size="md" variant="secondary" className="mt-6" onClick={onAction}>
          {action}
        </Button>
      )}
    </div>
  )
}

/** Ticket perforation: a dashed rule with two half-circle notches cut from the card edges. */
export function Perforation({ notchClassName = 'bg-ink-900', className }: { notchClassName?: string; className?: string }) {
  return (
    <div className={cn('relative h-6', className)} aria-hidden>
      <div className="absolute inset-x-5 top-1/2 border-t-[1.5px] border-dashed border-white/15" />
      <div className={cn('absolute -start-3 top-1/2 size-6 -translate-y-1/2 rounded-full', notchClassName)} />
      <div className={cn('absolute -end-3 top-1/2 size-6 -translate-y-1/2 rounded-full', notchClassName)} />
    </div>
  )
}

export function RatingPill({ rating, className }: { rating: number; className?: string }) {
  const { t, num } = useI18n()
  return (
    <span
      className={cn('glass-dark inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold text-white', className)}
      aria-label={t('common.ratingAria', { rating: num(rating) })}
    >
      <Star className="size-3.5 fill-warning text-warning" aria-hidden />
      <span aria-hidden>{num(rating)}</span>
    </span>
  )
}

/** Rolls a value in when it changes, used for live totals. */
export function RollingValue({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn('relative inline-flex overflow-hidden', className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: '60%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-60%', opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block tabular-nums"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-[24px] border border-white/[0.07] bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]', className)}>
      {children}
    </div>
  )
}

/** Row inside a grouped list; renders as a button when interactive. */
export function ListRow({
  icon,
  title,
  subtitle,
  trailing,
  onClick,
  href,
  className,
}: {
  icon?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  trailing?: ReactNode
  onClick?: () => void
  href?: string
  className?: string
}) {
  const content = (
    <>
      {icon && (
        <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-white/[0.06] text-fg [&_svg]:size-[19px]">{icon}</span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium">{title}</span>
        {subtitle && <span className="mt-0.5 block truncate text-[12.5px] text-fg-muted">{subtitle}</span>}
      </span>
      {trailing}
    </>
  )
  const classes = cn('flex w-full items-center gap-3.5 px-4 py-3.5 text-start', className)
  if (href) {
    return (
      <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className={cn(classes, 'transition-colors hover:bg-white/[0.03]')}>
        {content}
      </a>
    )
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(classes, 'transition-colors hover:bg-white/[0.03]')}>
        {content}
      </button>
    )
  }
  return <div className={classes}>{content}</div>
}

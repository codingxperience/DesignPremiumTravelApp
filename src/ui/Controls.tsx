import { motion } from 'motion/react'
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Check, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useI18n } from '@/state/store'
import { SPRING } from './motion'

export function Chip({
  selected,
  onClick,
  children,
  icon,
  className,
}: {
  selected?: boolean
  onClick?: () => void
  children: ReactNode
  icon?: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors duration-200 [&_svg]:size-4',
        selected
          ? 'border-brand-orange/60 bg-brand-orange/15 text-orange-200'
          : 'border-white/10 bg-white/[0.04] text-fg-muted hover:bg-white/[0.07] hover:text-fg',
        className,
      )}
    >
      {icon}
      {children}
    </button>
  )
}

type Option<T extends string> = { value: T; label: ReactNode }

/** Equal-width segmented control. The thumb moves by percentages, so it stays exact at any scale. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  direction,
}: {
  value: T
  onChange: (value: T) => void
  options: Option<T>[]
  label: string
  className?: string
  /** Overrides the app's reading direction (for controls rendered outside the phone). */
  direction?: 'ltr' | 'rtl'
}) {
  const { isRtl } = useI18n()
  const rtl = direction ? direction === 'rtl' : isRtl
  const index = Math.max(0, options.findIndex((option) => option.value === value))
  return (
    <div role="radiogroup" aria-label={label} dir={direction} className={cn('relative flex rounded-[16px] border border-white/[0.08] bg-white/[0.04] p-1', className)}>
      <motion.div
        aria-hidden
        className="absolute inset-y-1 rounded-[12px] bg-white/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_6px_16px_-8px_rgba(0,0,0,0.6)]"
        style={{ width: `calc((100% - 8px) / ${options.length})`, insetInlineStart: 4 }}
        initial={false}
        animate={{ x: `${(rtl ? -1 : 1) * index * 100}%` }}
        transition={SPRING}
      />
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative z-10 h-10 min-w-0 flex-1 truncate px-2 text-[13.5px] font-semibold transition-colors duration-200',
              active ? 'text-fg' : 'text-fg-subtle hover:text-fg-muted',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/** Underlined text tabs with an indicator measured from layout offsets. */
export function Tabs<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: Option<T>[]
  label: string
  className?: string
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [indicator, setIndicator] = useState({ x: 0, width: 0 })

  useLayoutEffect(() => {
    const measure = () => {
      const element = refs.current[value]
      if (element) setIndicator({ x: element.offsetLeft, width: element.offsetWidth })
    }
    measure()
    const observer = new ResizeObserver(measure)
    Object.values(refs.current).forEach((element) => element && observer.observe(element))
    return () => observer.disconnect()
  }, [value, options.length])

  return (
    <div role="tablist" aria-label={label} className={cn('relative flex gap-6 border-b border-white/[0.07]', className)}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            ref={(element) => {
              refs.current[option.value] = element
            }}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative h-11 shrink-0 text-[14.5px] font-semibold transition-colors duration-200',
              active ? 'text-fg' : 'text-fg-subtle hover:text-fg-muted',
            )}
          >
            {option.label}
          </button>
        )
      })}
      <motion.span
        aria-hidden
        className="absolute -bottom-px left-0 h-[2px] rounded-full bg-brand-orange"
        initial={false}
        animate={{ x: indicator.x, width: indicator.width }}
        transition={SPRING}
      />
    </div>
  )
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 9,
  label,
}: {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label: string
}) {
  const { t, num } = useI18n()
  const buttonClass =
    'grid size-9 place-items-center rounded-full border border-white/12 text-fg transition-colors hover:bg-white/[0.08] disabled:border-white/[0.06] disabled:text-fg-subtle/50 [&_svg]:size-4'
  return (
    <div role="group" aria-label={label} className="flex items-center gap-3">
      <button type="button" className={buttonClass} disabled={value <= min} onClick={() => onChange(value - 1)} aria-label={t('common.decrease', { label })}>
        <Minus />
      </button>
      <output aria-live="polite" className="w-6 text-center text-[16px] font-semibold tabular-nums">
        {num(value)}
      </output>
      <button type="button" className={buttonClass} disabled={value >= max} onClick={() => onChange(value + 1)} aria-label={t('common.increase', { label })}>
        <Plus />
      </button>
    </div>
  )
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  const { isRtl } = useI18n()
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn('relative h-[30px] w-[50px] shrink-0 rounded-full transition-colors duration-300', checked ? 'bg-brand-orange' : 'bg-white/[0.16]')}
    >
      <motion.span
        aria-hidden
        className="absolute top-[3px] size-6 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
        style={{ insetInlineStart: 3 }}
        initial={false}
        animate={{ x: checked ? (isRtl ? -20 : 20) : 0 }}
        transition={SPRING}
      />
    </button>
  )
}

/** Visual radio indicator for selectable cards (the card itself is the control). */
export function RadioMark({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-[22px] shrink-0 place-items-center rounded-full border-2 transition-colors duration-200',
        checked ? 'border-brand-orange bg-brand-orange text-ink-950' : 'border-white/20',
      )}
    >
      {checked && <Check className="size-3.5" strokeWidth={3} />}
    </span>
  )
}

export function CheckMark({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-[22px] shrink-0 place-items-center rounded-[7px] border-2 transition-colors duration-200',
        checked ? 'border-brand-orange bg-brand-orange text-ink-950' : 'border-white/20',
      )}
    >
      {checked && <Check className="size-3.5" strokeWidth={3} />}
    </span>
  )
}

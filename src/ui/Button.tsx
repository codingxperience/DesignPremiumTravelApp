import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'light' | 'outline' | 'black' | 'danger'
type Size = 'lg' | 'md' | 'sm'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand-orange text-ink-950 shadow-[0_16px_34px_-16px_rgba(243,99,36,0.95),inset_0_1px_0_rgba(255,255,255,0.28)] hover:bg-orange-400 disabled:bg-white/[0.08] disabled:text-fg-subtle disabled:shadow-none',
  secondary: 'border border-white/10 bg-white/[0.06] text-fg hover:bg-white/[0.1] disabled:text-fg-subtle',
  ghost: 'text-fg-muted hover:bg-white/[0.05] hover:text-fg',
  light: 'bg-white text-ink-950 hover:bg-white/90',
  outline: 'border border-brand-orange/50 text-orange-300 hover:bg-brand-orange/10',
  black: 'bg-black text-white ring-1 ring-white/15 hover:bg-black/75',
  danger: 'border border-danger/25 bg-danger/[0.08] text-danger hover:bg-danger/[0.14]',
}

const SIZES: Record<Size, string> = {
  lg: 'h-14 gap-2.5 rounded-[18px] px-6 text-[15px]',
  md: 'h-12 gap-2 rounded-2xl px-5 text-[14px]',
  sm: 'h-9 gap-1.5 rounded-xl px-3.5 text-[13px]',
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('size-5 animate-spin', className)} aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

export type ButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  variant?: Variant
  size?: Size
  block?: boolean
  loading?: boolean
  icon?: ReactNode
  iconEnd?: ReactNode
  children?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'lg',
  block,
  loading,
  icon,
  iconEnd,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  const inactive = disabled || loading
  return (
    <motion.button
      type={type}
      whileTap={inactive ? undefined : { scale: 0.97 }}
      disabled={inactive}
      aria-busy={loading || undefined}
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center font-semibold transition-colors duration-200',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      <span className={cn('inline-flex items-center justify-center gap-[inherit]', loading && 'invisible')}>
        {icon}
        {children}
        {iconEnd}
      </span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner />
        </span>
      )}
    </motion.button>
  )
}

type IconButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  label: string
  variant?: 'solid' | 'glass' | 'onImage' | 'plain' | 'orange'
  size?: 'lg' | 'md' | 'sm'
  children: ReactNode
}

const ICON_VARIANTS = {
  solid: 'border border-white/10 bg-white/[0.05] text-fg hover:bg-white/[0.09]',
  glass: 'glass text-fg hover:bg-white/10',
  onImage: 'glass-dark text-white hover:bg-black/30',
  plain: 'text-fg-muted hover:bg-white/[0.06] hover:text-fg',
  orange: 'bg-brand-orange text-ink-950 hover:bg-orange-400',
}

const ICON_SIZES = { lg: 'size-12 [&_svg]:size-[22px]', md: 'size-11 [&_svg]:size-5', sm: 'size-9 [&_svg]:size-[18px]' }

export function IconButton({ label, variant = 'solid', size = 'md', className, children, type = 'button', ...rest }: IconButtonProps) {
  return (
    <motion.button
      type={type}
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.92 }}
      className={cn(
        'relative inline-grid shrink-0 place-items-center rounded-full transition-colors duration-200',
        ICON_VARIANTS[variant],
        ICON_SIZES[size],
        className,
      )}
      {...rest}
    >
      {children}
    </motion.button>
  )
}

import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label: string
  icon?: ReactNode
  trailing?: ReactNode
  error?: string
  hint?: string
  containerClassName?: string
  /** Keeps values such as card numbers and codes left-to-right in Arabic. */
  ltr?: boolean
}

export function TextField({ label, icon, trailing, error, hint, containerClassName, ltr, id, className, ...input }: TextFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const messageId = `${inputId}-message`
  return (
    <div className={containerClassName}>
      <label htmlFor={inputId} className="mb-2 block text-[13px] font-medium text-fg-muted">
        {label}
      </label>
      <div
        className={cn(
          'flex h-14 items-center gap-3 rounded-2xl border bg-white/[0.04] px-4 transition-colors duration-200 focus-within:bg-white/[0.06] [&>svg]:size-5 [&>svg]:text-fg-subtle',
          error ? 'border-danger/60' : 'border-white/10 focus-within:border-brand-orange/70',
        )}
      >
        {icon}
        <input
          id={inputId}
          dir={ltr ? 'ltr' : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className={cn(
            'h-full min-w-0 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-fg-subtle focus-visible:outline-none',
            ltr && 'rtl:text-right',
            className,
          )}
          {...input}
        />
        {trailing}
      </div>
      {(error || hint) && (
        <p id={messageId} className={cn('mt-2 text-[12.5px]', error ? 'text-danger' : 'text-fg-subtle')}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}

/** Read-only field styled like an input that opens a picker. */
export function PickerField({
  label,
  value,
  placeholder,
  icon,
  onClick,
  className,
}: {
  label: string
  value?: ReactNode
  placeholder?: string
  icon?: ReactNode
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-w-0 flex-col items-start rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-start transition-colors hover:bg-white/[0.07]',
        className,
      )}
    >
      <span className="flex items-center gap-1.5 text-[12px] font-medium text-fg-subtle [&_svg]:size-3.5">
        {icon}
        {label}
      </span>
      <span className={cn('mt-1 w-full truncate text-[15px] font-semibold', !value && 'text-fg-subtle')}>{value ?? placeholder}</span>
    </button>
  )
}

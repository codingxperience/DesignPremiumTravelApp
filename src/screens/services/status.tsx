import { motion } from 'motion/react'
import { Check } from 'lucide-react'
import { EGYPT_APPROVAL, getVisaCountry } from '@/data/visas'
import type { Application, ApplicationStatus, FlagCode } from '@/data/types'
import { cn } from '@/lib/cn'
import { toIso } from '@/lib/dates'
import type { Localized, TKey } from '@/lib/i18n'
import { useI18n } from '@/state/store'

export const STATUS_STEPS: ApplicationStatus[] = ['submitted', 'documents', 'review', 'approved']

export function applicationInfo(application: Application): { title: Localized; flag: FlagCode; country: Localized } {
  if (application.service === 'egypt') {
    return { title: { en: 'Egypt security approval', ar: 'الموافقة الأمنية لمصر' }, flag: EGYPT_APPROVAL.flag, country: EGYPT_APPROVAL.name }
  }
  const country = getVisaCountry(application.countryId)
  return {
    title: { en: `${country?.name.en ?? ''} visa`, ar: `تأشيرة ${country?.name.ar ?? ''}` },
    flag: country?.flag ?? 'eu',
    country: country?.name ?? { en: '', ar: '' },
  }
}

export function statusTone(status: ApplicationStatus) {
  return status === 'approved' ? 'success' : status === 'review' ? 'warning' : 'sky'
}

/** Compact four-step progress used on cards. */
export function StatusProgress({ status }: { status: ApplicationStatus }) {
  const { t } = useI18n()
  const current = STATUS_STEPS.indexOf(status)
  return (
    <div>
      <div className="flex gap-1.5" aria-hidden>
        {STATUS_STEPS.map((step, index) => (
          <span key={step} className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            {index <= current && (
              <motion.span
                className={cn('absolute inset-0 origin-left rounded-full rtl:origin-right', index < current || status === 'approved' ? 'bg-success' : 'bg-warning')}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: index * 0.12 }}
              />
            )}
          </span>
        ))}
      </div>
      <p className="mt-2 text-[12px] text-fg-muted">
        {t(`status.${status}` as TKey)}
      </p>
    </div>
  )
}

/** Vertical timeline with a timestamp for each completed step. */
export function StatusTimeline({ application }: { application: Application }) {
  const { t, date, clock } = useI18n()
  const current = STATUS_STEPS.indexOf(application.status)
  const stamps: Record<ApplicationStatus, number | undefined> = {
    submitted: application.submittedAt,
    documents: current >= 1 ? application.submittedAt + 26 * 3_600_000 : undefined,
    review: current >= 2 ? application.updatedAt : undefined,
    approved: current >= 3 ? application.updatedAt : undefined,
  }
  return (
    <ol className="relative">
      {STATUS_STEPS.map((step, index) => {
        const done = index < current || application.status === 'approved'
        const active = index === current && application.status !== 'approved'
        const stamp = stamps[step]
        return (
          <li key={step} className="relative flex gap-4 pb-6 last:pb-0">
            {index < STATUS_STEPS.length - 1 && (
              <span aria-hidden className={cn('absolute start-[13px] top-8 h-[calc(100%-24px)] w-0.5 rounded-full', done ? 'bg-success/60' : 'bg-white/10')} />
            )}
            <span
              className={cn(
                'relative grid size-7 shrink-0 place-items-center rounded-full',
                done ? 'bg-success text-ink-950' : active ? 'bg-warning/20 text-warning ring-2 ring-warning/60' : 'bg-white/[0.06] text-fg-subtle',
              )}
            >
              {done ? <Check className="size-4" strokeWidth={3} /> : <span className="size-2 rounded-full bg-current" />}
              {active && <span aria-hidden className="absolute inset-0 animate-pulse-ring rounded-full bg-warning/40" />}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className={cn('text-[15px] font-semibold', !done && !active && 'text-fg-subtle')}>{t(`status.${step}` as TKey)}</p>
              <p className="mt-0.5 text-[12.5px] text-fg-muted">
                {stamp
                  ? `${date(toIso(new Date(stamp)), { weekday: 'short', day: 'numeric', month: 'short' })} · ${clock(new Date(stamp))}`
                  : active
                    ? t('status.inProgress')
                    : t('status.pending')}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

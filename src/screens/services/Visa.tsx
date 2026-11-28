import { ArrowRight, BadgeCheck, ChevronRight, Timer } from 'lucide-react'
import { VISA_COUNTRIES } from '@/data/visas'
import { cn } from '@/lib/cn'
import type { TKey } from '@/lib/i18n'
import { PHOTOS } from '@/lib/images'
import { useI18n, useLiveApp, useNav } from '@/state/store'
import { Flag } from '@/ui/Flag'
import { Heading } from '@/ui/Heading'
import { Img } from '@/ui/Img'
import { Card } from '@/ui/Misc'
import { FLIP_RTL } from '@/ui/motion'
import { Screen, ScreenHeader } from '@/ui/Screen'

const STEPS: TKey[] = ['visa.step1', 'visa.step2', 'visa.step3', 'visa.step4']

export function VisaScreen() {
  const live = useLiveApp()
  const { t, tp, L, money, num, lang } = useI18n()
  const { push } = useNav()

  return (
    <Screen label={t('visa.title')} header={<ScreenHeader title={t('visa.title')} />} className="px-5 pb-10 pt-2">
      <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(150deg,#ff8a4c_0%,#f36324_45%,#c94a14_100%)] p-5 text-ink-950 shadow-[0_30px_50px_-30px_rgba(243,99,36,0.9)]">
        <Img id={PHOTOS.passportStamps} alt="" width={180} height={210} className="absolute inset-y-0 end-0 h-full w-[44%] opacity-90 [mask-image:linear-gradient(90deg,transparent,#000_45%)] rtl:[mask-image:linear-gradient(270deg,transparent,#000_45%)]" />
        <div className="relative max-w-[62%]">
          <Heading as="h2" size="lg" className="text-ink-950">
            {live ? t('visa.title') : t('visa.tagline')}
          </Heading>
          {live ? <p className="mt-3 text-sm">{lang === 'ar' ? 'اختر وجهتك لإرسال استفسار إلى مكتب السفر.' : 'Choose a destination to ask the travel desk about your visa.'}</p> : <ul className="mt-4 space-y-2">
            {(['visa.fast', 'visa.support'] as TKey[]).map((key) => (
              <li key={key} className="flex items-center gap-2 text-[13px] font-semibold">
                <BadgeCheck className="size-[18px] shrink-0" />
                {t(key)}
              </li>
            ))}
          </ul>}
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-[18px] font-semibold">{t('visa.choose')}</h2>
      <Card className="divide-y divide-white/[0.06] overflow-hidden">
        {VISA_COUNTRIES.map((country) => (
          <button
            key={country.id}
            type="button"
            onClick={() => push({ name: 'application', service: 'visa', countryId: country.id })}
            className="flex w-full items-center gap-3.5 px-4 py-3.5 text-start transition-colors hover:bg-white/[0.03]"
          >
            <Flag code={country.flag} className="size-10" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold">{L(country.name)}</span>
              <span className="block truncate text-[12.5px] text-fg-muted">{L(country.type)}</span>
              {!live && <span className="mt-1 flex items-center gap-1 text-[11.5px] text-fg-subtle">
                <Timer className="size-3.5" aria-hidden />
                {tp('visa.processing', country.processingDays)}
              </span>}
            </span>
            {!live && <span className="text-end">
              <span className="block text-[11px] text-fg-subtle">{t('visa.fee')}</span>
              <span className="block text-[15px] font-semibold tabular-nums">{money(country.fee)}</span>
            </span>}
            <ChevronRight className={cn('size-5 shrink-0 text-fg-subtle', FLIP_RTL)} />
          </button>
        ))}
      </Card>

      {!live && <><h2 className="mb-4 mt-8 text-[18px] font-semibold">{t('visa.how')}</h2>
      <ol className="relative space-y-5">
        {STEPS.map((step, index) => (
          <li key={step} className="relative flex items-center gap-4">
            {index < STEPS.length - 1 && <span aria-hidden className="absolute start-[19px] top-10 h-5 w-px bg-white/15" />}
            <span className="grid size-10 shrink-0 place-items-center rounded-full border border-brand-orange/40 bg-brand-orange/12 text-[14px] font-bold text-orange-300">
              {num(index + 1)}
            </span>
            <span className="flex-1 text-[14.5px] font-medium">{t(step)}</span>
            {index === STEPS.length - 1 && <ArrowRight className={cn('size-4 text-success', FLIP_RTL)} />}
          </li>
        ))}
      </ol></>}
    </Screen>
  )
}

import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { CalendarDays, LockKeyhole, Plus, ShieldCheck, Tag, Users } from 'lucide-react'
import { USER } from '@/data/demo'
import { getPackage } from '@/data/packages'
import { both, generateItinerary } from '@/data/quotes'
import type { Booking, BookingDraft, PriceLine } from '@/data/types'
import { cn } from '@/lib/cn'
import { translate } from '@/lib/i18n'
import { useAppState, useDispatch, useI18n, useNav } from '@/state/store'
import { Button } from '@/ui/Button'
import { RadioMark } from '@/ui/Controls'
import { Img } from '@/ui/Img'
import { Card, RollingValue } from '@/ui/Misc'
import { OverlayPortal } from '@/ui/Overlay'
import { EASE_OUT } from '@/ui/motion'
import { Screen, ScreenHeader, StickyFooter } from '@/ui/Screen'
import { Avatar } from '../explore/shared'
import { Breakdown } from './Booking'
import { AddCardSheet, CardBrandMark } from './AddCardSheet'

const PROMO_CODE = 'CROSS10'

function bookingReference(): string {
  return `CW-${Math.floor(10_000 + Math.random() * 90_000)}`
}

function Processing({ amount }: { amount: string }) {
  const { t } = useI18n()
  return (
    <motion.div
      className="absolute inset-0 grid place-items-center bg-ink-950/80 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="alertdialog"
      aria-live="assertive"
      aria-label={t('pay.processing')}
    >
      <motion.div
        className="flex flex-col items-center px-10 text-center"
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
      >
        <div className="relative grid size-24 place-items-center">
          <span className="absolute inset-0 rounded-full border-2 border-white/10" />
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-brand-orange" />
          <LockKeyhole className="size-8 text-orange-300" />
        </div>
        <p className="mt-7 text-[17px] font-semibold">{t('pay.processing')}</p>
        <p className="mt-1.5 text-[14px] text-fg-muted tabular-nums">{amount}</p>
      </motion.div>
    </motion.div>
  )
}

export function PaymentScreen({ draft }: { draft: BookingDraft }) {
  const { t, tp, L, money, range, date } = useI18n()
  const { cards, defaultCardId, tab } = useAppState()
  const dispatch = useDispatch()
  const { reset } = useNav()
  const [method, setMethod] = useState<string>(defaultCardId)
  const [promo, setPromo] = useState('')
  const [applied, setApplied] = useState(false)
  const [promoError, setPromoError] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const discount = applied ? Math.round(draft.total * 0.1) : 0
  const total = draft.total - discount
  const discountLine: PriceLine = { label: both((lang) => `${translate(lang, 'pay.discount')} · ${PROMO_CODE}`), amount: -discount }
  const lines = applied ? [...draft.lines, discountLine] : draft.lines
  const travellers = draft.adults + draft.children

  const applyPromo = () => {
    const ok = promo.trim().toUpperCase() === PROMO_CODE
    setApplied(ok)
    setPromoError(!ok)
  }

  const pay = () => {
    setProcessing(true)
    timer.current = window.setTimeout(() => {
      const booking: Booking = {
        ...draft,
        lines,
        total,
        id: `bk-${Date.now()}`,
        ref: bookingReference(),
        status: 'confirmed',
        createdAt: Date.now(),
        isNew: true,
        itinerary: draft.packageId && draft.destinationId ? generateItinerary(draft.destinationId, getPackage(draft.packageId).nights) : undefined,
      }
      dispatch({ type: 'ADD_BOOKING', booking })
      reset(tab, [{ name: 'success', bookingId: booking.id }])
    }, 1900)
  }

  const methods: { id: string; label: string; sub?: string; brand: Parameters<typeof CardBrandMark>[0]['brand'] }[] = [
    { id: 'apple', label: t('pay.applePay'), brand: 'apple' },
    ...cards.map((card) => ({
      id: card.id,
      label: t('pay.card', { brand: card.brand, last4: card.last4 }),
      sub: t('pay.expires', { date: card.expiry }),
      brand: card.brand,
    })),
  ]

  return (
    <Screen
      label={t('pay.title')}
      header={<ScreenHeader title={t('pay.title')} />}
      footer={
        <StickyFooter className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[12px] text-fg-subtle">{t('pay.total')}</p>
            <RollingValue value={money(total)} className="text-[22px] font-semibold" />
          </div>
          <Button onClick={pay} loading={processing} className="min-w-[170px]" icon={<LockKeyhole className="size-[18px]" />}>
            {t('pay.pay', { amount: money(total) })}
          </Button>
        </StickyFooter>
      }
      className="px-5 pb-8 pt-2"
    >
      <h2 className="mb-3 text-[15px] font-semibold">{t('pay.summary')}</h2>
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3.5 p-3">
          <span className="block size-[68px] shrink-0 overflow-hidden rounded-[16px] bg-ink-700">
            <Img id={draft.image} alt="" width={68} height={68} className="size-full" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15.5px] font-semibold">{L(draft.title)}</p>
            <p className="mt-0.5 truncate text-[12.5px] text-fg-muted">{L(draft.subtitle)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-white/[0.06] text-[12.5px]">
          <p className="flex items-center gap-2 px-4 py-3 text-fg-muted">
            <CalendarDays className="size-4 shrink-0" />
            <span className="truncate">
              {draft.endDate ? range(draft.startDate, draft.endDate) : date(draft.startDate, { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </p>
          <p className="flex items-center gap-2 border-s border-white/[0.06] px-4 py-3 text-fg-muted">
            <Users className="size-4 shrink-0" />
            {tp('common.travellers', travellers)}
          </p>
        </div>
      </Card>

      <h2 className="mb-3 mt-7 text-[15px] font-semibold">{t('pay.lead')}</h2>
      <Card className="flex items-center gap-3.5 p-3.5">
        <Avatar id={USER.avatar} alt={USER.name} className="size-11" />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold">{USER.name}</p>
          <p className="text-[12.5px] text-fg-muted">
            {t('pay.passport', { last4: USER.passportLast4 })} · {USER.email}
          </p>
        </div>
        <ShieldCheck className="size-5 text-success" aria-hidden />
      </Card>

      <h2 className="mb-3 mt-7 text-[15px] font-semibold">{t('pay.method')}</h2>
      <Card className="divide-y divide-white/[0.06]">
        <div role="radiogroup" aria-label={t('pay.method')} className="divide-y divide-white/[0.06]">
          {methods.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={method === option.id}
              onClick={() => setMethod(option.id)}
              className="flex w-full items-center gap-3.5 px-4 py-3.5 text-start transition-colors hover:bg-white/[0.03]"
            >
              <CardBrandMark brand={option.brand} />
              <span className="min-w-0 flex-1">
                <span className="block text-[14.5px] font-medium" dir="auto">
                  {option.label}
                </span>
                {option.sub && <span className="block text-[12px] text-fg-subtle">{option.sub}</span>}
              </span>
              <RadioMark checked={method === option.id} />
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setAddOpen(true)} className="flex w-full items-center gap-3.5 px-4 py-3.5 text-start text-orange-300 transition-colors hover:bg-white/[0.03]">
          <span className="grid h-8 w-12 place-items-center rounded-[8px] border border-dashed border-orange-300/50">
            <Plus className="size-4" />
          </span>
          <span className="text-[14.5px] font-semibold">{t('pay.addCard')}</span>
        </button>
      </Card>

      <h2 className="mb-3 mt-7 text-[15px] font-semibold">{t('pay.promo')}</h2>
      <div className={cn('flex h-14 items-center gap-2 rounded-2xl border bg-white/[0.04] pe-1.5 ps-4', promoError ? 'border-danger/60' : applied ? 'border-success/50' : 'border-white/10 focus-within:border-brand-orange/70')}>
        <Tag className="size-5 shrink-0 text-fg-subtle" aria-hidden />
        <input
          value={promo}
          onChange={(event) => {
            setPromo(event.target.value)
            setPromoError(false)
          }}
          onKeyDown={(event) => event.key === 'Enter' && applyPromo()}
          placeholder={t('pay.promoPlaceholder')}
          aria-label={t('pay.promo')}
          aria-invalid={promoError || undefined}
          dir="ltr"
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] uppercase tracking-[0.06em] outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-fg-subtle focus-visible:outline-none rtl:text-right"
        />
        <Button size="sm" variant="secondary" onClick={applyPromo} disabled={!promo.trim()}>
          {t('common.apply')}
        </Button>
      </div>
      <AnimatePresence initial={false}>
        {(applied || promoError) && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cn('mt-2 overflow-hidden text-[12.5px]', applied ? 'text-success' : 'text-danger')}
            aria-live="polite"
          >
            {applied ? t('pay.promoApplied', { code: PROMO_CODE }) : t('pay.promoInvalid')}
          </motion.p>
        )}
      </AnimatePresence>

      <h2 className="mb-3 mt-7 text-[15px] font-semibold">{t('booking.breakdown')}</h2>
      <Breakdown lines={lines} total={total} />

      <p className="mt-5 flex items-start gap-2.5 text-[12.5px] leading-relaxed text-fg-subtle">
        <LockKeyhole className="mt-0.5 size-4 shrink-0" />
        <span>
          {t('pay.secure')} {t('brand.company')}
        </span>
      </p>

      <AddCardSheet open={addOpen} onClose={() => setAddOpen(false)} onAdded={setMethod} />
      <OverlayPortal>
        <AnimatePresence>{processing && <Processing amount={money(total)} />}</AnimatePresence>
      </OverlayPortal>
    </Screen>
  )
}

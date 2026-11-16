import { motion } from 'motion/react'
import { CalendarDays, Copy, Users } from 'lucide-react'
import { USER } from '@/data/demo'
import { useAppState, useI18n, useNav, useToast } from '@/state/store'
import { Button } from '@/ui/Button'
import { Heading } from '@/ui/Heading'
import { Img } from '@/ui/Img'
import { Card } from '@/ui/Misc'
import { EASE_OUT } from '@/ui/motion'
import { Screen, StickyFooter } from '@/ui/Screen'
import { BoardingPass } from './BoardingPass'

function SuccessMark() {
  return (
    <div className="relative mx-auto grid size-24 place-items-center" aria-hidden>
      {[0, 1].map((ring) => (
        <motion.span
          key={ring}
          className="absolute inset-0 rounded-full border border-brand-orange/40"
          initial={{ scale: 0.8, opacity: 0.8 }}
          animate={{ scale: 1.9, opacity: 0 }}
          transition={{ duration: 1.8, ease: 'easeOut', delay: 0.6 + ring * 0.5, repeat: Infinity, repeatDelay: 1.2 }}
        />
      ))}
      <svg viewBox="0 0 96 96" className="size-24">
        <motion.circle
          cx="48"
          cy="48"
          r="44"
          fill="rgba(243,99,36,0.14)"
          stroke="#f36324"
          strokeWidth="3"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
        />
        <motion.path
          d="M30 49.5 42.5 62 66 36"
          fill="none"
          stroke="#f36324"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.55 }}
        />
      </svg>
    </div>
  )
}

export function SuccessScreen({ bookingId }: { bookingId: string }) {
  const { t, tp, L, money, range, date } = useI18n()
  const { bookings } = useAppState()
  const { reset } = useNav()
  const toast = useToast()
  const booking = bookings.find((b) => b.id === bookingId)
  if (!booking) return null

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(booking.ref)
    } catch {
      // Clipboard can be unavailable in embedded previews.
    }
    toast(t('common.copied'))
  }

  return (
    <Screen
      label={t('success.title')}
      footer={
        <StickyFooter className="space-y-2">
          <Button block onClick={() => reset('trips', [{ name: 'trip', bookingId: booking.id }])}>
            {t('success.viewTrip')}
          </Button>
          <Button block variant="ghost" size="md" onClick={() => reset('explore')}>
            {t('success.home')}
          </Button>
        </StickyFooter>
      }
      className="px-5 pt-[calc(var(--sat)+28px)]"
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(70%_60%_at_50%_0%,rgba(243,99,36,0.2),transparent)]" />
      <SuccessMark />
      <motion.div className="mt-6 text-center" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.8 }}>
        <Heading as="h1" size="xl">
          {t('success.title')}
        </Heading>
        <p className="mx-auto mt-3 max-w-[300px] text-[14.5px] leading-relaxed text-fg-muted">{t('success.body', { email: USER.email })}</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE_OUT, delay: 1 }} className="mt-7 space-y-4 pb-6">
        <Card className="flex items-center justify-between gap-3 px-4 py-3.5">
          <div>
            <p className="text-[12px] text-fg-subtle">{t('success.ref')}</p>
            <p className="text-[18px] font-semibold tracking-[0.08em]" dir="ltr">
              {booking.ref}
            </p>
          </div>
          <Button size="sm" variant="secondary" icon={<Copy className="size-4" />} onClick={copy}>
            {t('common.copy')}
          </Button>
        </Card>

        {booking.flight ? (
          <BoardingPass booking={booking} />
        ) : (
          <Card className="overflow-hidden">
            <div className="relative h-40 bg-ink-800">
              <Img id={booking.image} alt="" width={350} height={160} className="absolute inset-0 size-full" />
              <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(5,11,23,0.85))]" />
              <div className="absolute inset-x-4 bottom-3.5">
                <p className="text-[17px] font-semibold text-white">{L(booking.title)}</p>
                <p className="text-[12.5px] text-white/75">{L(booking.subtitle)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 text-[12.5px]">
              <p className="flex items-center gap-2 px-4 py-3 text-fg-muted">
                <CalendarDays className="size-4" />
                {booking.endDate ? range(booking.startDate, booking.endDate) : date(booking.startDate, { day: 'numeric', month: 'short' })}
              </p>
              <p className="flex items-center gap-2 border-s border-white/[0.06] px-4 py-3 text-fg-muted">
                <Users className="size-4" />
                {tp('common.travellers', booking.adults + booking.children)}
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3.5">
              <span className="text-[13.5px] text-fg-muted">{t('common.total')}</span>
              <span className="text-[18px] font-semibold tabular-nums">{money(booking.total)}</span>
            </div>
          </Card>
        )}
      </motion.div>
    </Screen>
  )
}

import { motion } from 'motion/react'
import { useEffect } from 'react'
import { CreditCard, PlaneTakeoff, ShieldCheck, Sparkles, TrendingDown } from 'lucide-react'
import { SEED_NOTIFICATIONS } from '@/data/demo'
import type { AppNotification } from '@/data/types'
import { cn } from '@/lib/cn'
import type { Route } from '@/state/routes'
import { useAppState, useDispatch, useI18n, useNav } from '@/state/store'
import { EASE_OUT } from '@/ui/motion'
import { Screen, ScreenHeader } from '@/ui/Screen'

const ICONS = {
  approval: { icon: ShieldCheck, tone: 'bg-success/12 text-success' },
  price: { icon: TrendingDown, tone: 'bg-brand-orange/14 text-orange-300' },
  checkin: { icon: PlaneTakeoff, tone: 'bg-sky/12 text-sky' },
  payment: { icon: CreditCard, tone: 'bg-white/[0.07] text-fg' },
  welcome: { icon: Sparkles, tone: 'bg-brand-orange/14 text-orange-300' },
}

const TARGETS: Record<AppNotification['target'], Route> = {
  application: { name: 'applicationStatus', id: 'ap-egypt' },
  istanbul: { name: 'destination', id: 'istanbul' },
  'trip-cairo': { name: 'trip', bookingId: 'bk-cairo' },
  'trip-umrah': { name: 'trip', bookingId: 'bk-umrah' },
  offers: { name: 'egypt' },
}

const DAY = 86_400_000

export function NotificationsScreen() {
  const { t, L, relative } = useI18n()
  const { notificationsRead } = useAppState()
  const dispatch = useDispatch()
  const { push } = useNav()

  // Leaving the screen counts as having seen everything on it.
  useEffect(() => () => dispatch({ type: 'MARK_NOTIFICATIONS_READ' }), [dispatch])

  const fresh = SEED_NOTIFICATIONS.filter((n) => Date.now() - n.at < DAY)
  const earlier = SEED_NOTIFICATIONS.filter((n) => Date.now() - n.at >= DAY)

  const renderGroup = (title: string, items: AppNotification[], unread: boolean, offset: number) => (
    <section className="mt-6">
      <h2 className="px-5 text-[12.5px] font-semibold uppercase tracking-[0.12em] text-fg-subtle">{title}</h2>
      <ul className="mt-2">
        {items.map((notification, index) => {
          const { icon: Icon, tone } = ICONS[notification.icon]
          return (
            <motion.li
              key={notification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE_OUT, delay: (offset + index) * 0.05 }}
            >
              <button
                type="button"
                onClick={() => push(TARGETS[notification.target])}
                className="flex w-full items-start gap-3.5 px-5 py-3.5 text-start transition-colors hover:bg-white/[0.03]"
              >
                <span className={cn('grid size-11 shrink-0 place-items-center rounded-[15px]', tone)}>
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{L(notification.title)}</span>
                    <span className="shrink-0 text-[11.5px] text-fg-subtle">{relative(new Date(notification.at))}</span>
                  </span>
                  <span className="mt-1 block text-[13.5px] leading-snug text-fg-muted">{L(notification.body)}</span>
                </span>
                {unread && <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-brand-orange" />}
              </button>
            </motion.li>
          )
        })}
      </ul>
    </section>
  )

  return (
    <Screen
      label={t('notif.title')}
      header={
        <ScreenHeader
          title={t('notif.title')}
          actions={
            !notificationsRead && (
              <button
                type="button"
                onClick={() => dispatch({ type: 'MARK_NOTIFICATIONS_READ' })}
                className="whitespace-nowrap text-[12.5px] font-semibold text-orange-300 hover:text-orange-200"
              >
                {t('notif.markAll')}
              </button>
            )
          }
        />
      }
      className="pb-10"
    >
      {renderGroup(t('notif.new'), fresh, !notificationsRead, 0)}
      {renderGroup(t('notif.earlier'), earlier, false, fresh.length)}
      {notificationsRead && <p className="mt-8 text-center text-[13px] text-fg-subtle">{t('notif.allRead')}</p>}
    </Screen>
  )
}

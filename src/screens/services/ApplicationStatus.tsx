import { useEffect } from 'react'
import { CalendarDays, IdCard, MessageCircle, Phone, UserRound } from 'lucide-react'
import { CONTACT, USER } from '@/data/demo'
import { useAppState, useDispatch, useI18n, useNav } from '@/state/store'
import { Button } from '@/ui/Button'
import { Flag } from '@/ui/Flag'
import { Badge, Card, ListRow } from '@/ui/Misc'
import { Screen, ScreenHeader } from '@/ui/Screen'
import { applicationInfo, StatusProgress, statusTone, StatusTimeline } from './status'

export function ApplicationStatusScreen({ id }: { id: string }) {
  const { t, L, date, relative } = useI18n()
  const { applications } = useAppState()
  const dispatch = useDispatch()
  const { setTab } = useNav()
  const application = applications.find((a) => a.id === id)

  useEffect(() => {
    if (application?.isNew) dispatch({ type: 'SEEN_APPLICATION', id: application.id })
  }, [application?.id, application?.isNew, dispatch])

  if (!application) return null
  const info = applicationInfo(application)

  return (
    <Screen label={t('app.statusTitle')} header={<ScreenHeader title={t('app.statusTitle')} subtitle={application.ref} />} className="space-y-4 px-5 pb-10 pt-2">
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3.5 bg-[linear-gradient(135deg,rgba(22,69,137,0.55),rgba(22,69,137,0.1))] p-4">
          <Flag code={info.flag} className="size-11" />
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-semibold">{L(info.title)}</p>
            <p className="text-[12.5px] text-fg-muted" dir="ltr">
              {application.ref}
            </p>
          </div>
          <Badge tone={statusTone(application.status)} dot>
            {t(`status.${application.status}`)}
          </Badge>
        </div>
        <div className="p-4">
          <StatusProgress status={application.status} />
          <p className="mt-1 text-[12px] text-fg-subtle">{t('trips.updated', { time: relative(new Date(application.updatedAt)) })}</p>
        </div>
      </Card>

      <Card className="p-5">
        <StatusTimeline application={application} />
      </Card>

      <Card className="divide-y divide-white/[0.06]">
        <ListRow icon={<UserRound />} title={application.applicant} subtitle={t('app.applicant')} />
        <ListRow icon={<IdCard />} title={t('pay.passport', { last4: USER.passportLast4 })} subtitle={t('doc.passport')} />
        <ListRow icon={<CalendarDays />} title={date(application.travelDate, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })} subtitle={t('app.travelDate')} />
      </Card>

      <p className="px-1 text-center text-[13px] text-fg-muted">{t('app.notify')}</p>

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <Button variant="secondary" icon={<MessageCircle className="size-5 text-orange-300" />} onClick={() => setTab('support')}>
          {t('app.chatOfficer')}
        </Button>
        <a
          href={CONTACT.phoneHref}
          aria-label={t('chat.callAria')}
          className="grid size-14 place-items-center rounded-[18px] border border-white/10 bg-white/[0.06] text-fg transition-colors hover:bg-white/[0.1]"
        >
          <Phone className="size-5" />
        </a>
      </div>
    </Screen>
  )
}

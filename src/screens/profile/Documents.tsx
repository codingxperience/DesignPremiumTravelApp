import { ChevronRight, ShieldCheck, Umbrella } from 'lucide-react'
import { USER } from '@/data/demo'
import { cn } from '@/lib/cn'
import { useAppState, useI18n, useNav, useToast } from '@/state/store'
import { Flag } from '@/ui/Flag'
import { Badge, Card, ListRow } from '@/ui/Misc'
import { FLIP_RTL } from '@/ui/motion'
import { Screen, ScreenHeader } from '@/ui/Screen'
import { applicationInfo, statusTone } from '../services/status'

export function DocumentsScreen() {
  const { t, L, date } = useI18n()
  const { applications } = useAppState()
  const { push } = useNav()
  const toast = useToast()
  const expires = (iso: string) => t('docs.expires', { date: date(iso, { month: 'short', year: 'numeric' }) })

  return (
    <Screen label={t('docs.title')} header={<ScreenHeader title={t('docs.title')} />} className="space-y-6 px-5 pb-10 pt-2">
      <Card className="divide-y divide-white/[0.06] overflow-hidden">
        <ListRow
          icon={<Flag code="sd" className="size-6" />}
          title={t('doc.passport')}
          subtitle={`${t('docs.number', { last4: USER.passportLast4 })} · ${expires(USER.passportExpiry)}`}
          trailing={<Badge tone="success">{t('doc.verified')}</Badge>}
          onClick={() => toast(t('doc.opened', { name: t('doc.passport') }))}
        />
        <ListRow
          icon={<Flag code="gb" className="size-6" />}
          title={t('doc.residence')}
          subtitle={expires(USER.residenceExpiry)}
          trailing={<Badge tone="success">{t('doc.verified')}</Badge>}
          onClick={() => toast(t('doc.opened', { name: t('doc.residence') }))}
        />
        <ListRow
          icon={<Umbrella />}
          title={t('doc.insurance')}
          subtitle="CW-48213"
          trailing={<Badge tone="success">{t('doc.active')}</Badge>}
          onClick={() => toast(t('doc.opened', { name: t('doc.insurance') }))}
        />
      </Card>

      {applications.length > 0 && (
        <section>
          <h2 className="mb-2.5 px-1 text-[12.5px] font-semibold uppercase tracking-[0.12em] text-fg-subtle">{t('trips.applications')}</h2>
          <Card className="divide-y divide-white/[0.06] overflow-hidden">
            {applications.map((application) => {
              const info = applicationInfo(application)
              return (
                <ListRow
                  key={application.id}
                  icon={<ShieldCheck />}
                  title={L(info.title)}
                  subtitle={application.ref}
                  trailing={
                    <span className="flex items-center gap-2">
                      <Badge tone={statusTone(application.status)}>{t(`status.${application.status}`)}</Badge>
                      <ChevronRight className={cn('size-5 text-fg-subtle', FLIP_RTL)} />
                    </span>
                  }
                  onClick={() => push({ name: 'applicationStatus', id: application.id })}
                />
              )
            })}
          </Card>
        </section>
      )}
    </Screen>
  )
}

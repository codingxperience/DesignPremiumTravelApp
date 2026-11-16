import { ArrowRight, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { SERVICE_ROUTES, type ServiceId } from '@/state/routes'
import { useAppState, useI18n, useNav } from '@/state/store'
import { Sheet } from '@/ui/Overlay'
import { FLIP_RTL } from '@/ui/motion'
import { SERVICES, type ServiceItem } from './items'

export function ServiceTile({ service, onClick, compact }: { service: ServiceItem; onClick: () => void; compact?: boolean }) {
  const { t } = useI18n()
  const Icon = service.icon
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-start rounded-[22px] border border-white/[0.08] bg-white/[0.035] text-start transition-colors hover:bg-white/[0.06]',
        compact ? 'gap-3 p-3.5' : 'gap-4 p-4',
      )}
    >
      <span
        className={cn(
          'grid size-11 place-items-center rounded-[15px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]',
          service.offer
            ? 'bg-[linear-gradient(150deg,#ff8a4c,#d9531a)]'
            : 'bg-[linear-gradient(150deg,#2a62b4,#123566)]',
        )}
      >
        <Icon className="size-[22px]" />
      </span>
      <span className="min-w-0">
        <span className="block text-[14.5px] font-semibold leading-snug">{t(service.label)}</span>
        <span className="mt-0.5 block text-[12.5px] leading-snug text-fg-muted">{t(service.description)}</span>
      </span>
      {service.offer && (
        <span className="absolute end-3 top-3 rounded-full bg-brand-orange px-2 py-0.5 text-[10.5px] font-bold text-ink-950">{t('services.offer')}</span>
      )}
    </button>
  )
}

/** Booking services in a bottom sheet, used by the Capsule and Ticket navigation concepts. */
export function ServicesSheet() {
  const { servicesOpen } = useAppState()
  const { openServices, push, setTab } = useNav()
  const { t } = useI18n()
  const choose = (id: ServiceId) => push(SERVICE_ROUTES[id])

  return (
    <Sheet open={servicesOpen} onClose={() => openServices(false)} title={t('services.title')} label={t('services.title')}>
      <p className="-mt-1 mb-4 text-[14px] text-fg-muted">{t('services.subtitle')}</p>
      <div className="grid grid-cols-2 gap-3">
        {SERVICES.map((service) => (
          <ServiceTile key={service.id} service={service} onClick={() => choose(service.id)} />
        ))}
      </div>
      <button
        type="button"
        onClick={() => setTab('support')}
        className="mt-4 flex w-full items-center gap-3 rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-4 text-start transition-colors hover:bg-white/[0.06]"
      >
        <span className="grid size-10 place-items-center rounded-full bg-brand-orange/15 text-orange-300">
          <MessageCircle className="size-5" />
        </span>
        <span className="flex-1">
          <span className="block text-[13px] text-fg-muted">{t('services.help')}</span>
          <span className="block text-[14.5px] font-semibold">{t('services.helpCta')}</span>
        </span>
        <ArrowRight className={cn('size-5 text-fg-subtle', FLIP_RTL)} />
      </button>
    </Sheet>
  )
}

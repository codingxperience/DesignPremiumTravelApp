import { BedDouble, Compass, Headset, Plane, ShieldCheck, Stamp, TicketsPlane, TreePalm, UserRound, type LucideIcon } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TKey } from '@/lib/i18n'
import type { ServiceId, Tab } from '@/state/routes'
import { useAppState } from '@/state/store'
import { KaabaIcon } from '@/ui/Icons'

export const TABS: { id: Tab; icon: LucideIcon; label: TKey }[] = [
  { id: 'explore', icon: Compass, label: 'nav.explore' },
  { id: 'trips', icon: TicketsPlane, label: 'nav.trips' },
  { id: 'support', icon: Headset, label: 'nav.support' },
  { id: 'profile', icon: UserRound, label: 'nav.profile' },
]

export type ServiceItem = {
  id: ServiceId
  icon: ComponentType<{ className?: string }>
  label: TKey
  description: TKey
  offer?: boolean
}

export const SERVICES: ServiceItem[] = [
  { id: 'flights', icon: Plane, label: 'service.flights', description: 'service.flights.desc' },
  { id: 'hotels', icon: BedDouble, label: 'service.hotels', description: 'service.hotels.desc' },
  { id: 'holidays', icon: TreePalm, label: 'service.holidays', description: 'service.holidays.desc' },
  { id: 'umrah', icon: KaabaIcon, label: 'service.umrah', description: 'service.umrah.desc' },
  { id: 'visa', icon: Stamp, label: 'service.visa', description: 'service.visa.desc' },
  { id: 'egypt', icon: ShieldCheck, label: 'service.egypt', description: 'service.egypt.desc', offer: true },
]

/** Which tabs currently carry an unread dot. */
export function useTabBadges(): Record<Tab, boolean> {
  const { bookings, applications, chat, chatSeen } = useAppState()
  const agentMessages = chat.filter((m) => m.from === 'agent').length
  return {
    explore: false,
    trips: bookings.some((b) => b.isNew) || applications.some((a) => a.isNew),
    support: agentMessages > chatSeen,
    profile: false,
  }
}

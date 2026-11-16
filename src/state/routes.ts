import type { BookingDraft, FlightQuery } from '@/data/types'

export type Phase = 'splash' | 'onboarding' | 'auth' | 'app'
export type AuthScreen = 'signin' | 'signup' | 'verify'
export type Tab = 'explore' | 'trips' | 'support' | 'profile'
export type NavStyle = 'orbit' | 'capsule' | 'ticket'
export type ServiceId = 'flights' | 'hotels' | 'holidays' | 'umrah' | 'visa' | 'egypt'
export type DestinationTab = 'overview' | 'packages' | 'essentials'

export type BookableItem =
  | { kind: 'package'; packageId: string }
  | { kind: 'hotel'; hotelId: string; checkIn: string; checkOut: string; adults: number }

export type Route =
  | { name: 'search' }
  | { name: 'notifications' }
  | { name: 'destination'; id: string; tab?: DestinationTab }
  | { name: 'flightSearch'; to?: string }
  | { name: 'flightResults'; query: FlightQuery }
  | { name: 'flightDetails'; query: FlightQuery; flightId: string }
  | { name: 'seats'; draft: BookingDraft }
  | { name: 'booking'; item: BookableItem }
  | { name: 'payment'; draft: BookingDraft }
  | { name: 'success'; bookingId: string }
  | { name: 'ticket'; bookingId: string }
  | { name: 'trip'; bookingId: string }
  | { name: 'hotels'; cityId?: string }
  | { name: 'holidays' }
  | { name: 'umrah'; tab?: 'umrah' | 'hajj' }
  | { name: 'visa' }
  | { name: 'egypt' }
  | { name: 'application'; service: 'egypt' | 'visa'; countryId: string }
  | { name: 'applicationStatus'; id: string }
  | { name: 'saved' }
  | { name: 'documents' }
  | { name: 'payments' }

export type Scenario = {
  phase: Phase
  auth?: AuthScreen
  tab?: Tab
  routes?: Route[]
  servicesOpen?: boolean
}

export const SERVICE_ROUTES: Record<ServiceId, Route> = {
  flights: { name: 'flightSearch' },
  hotels: { name: 'hotels' },
  holidays: { name: 'holidays' },
  umrah: { name: 'umrah' },
  visa: { name: 'visa' },
  egypt: { name: 'egypt' },
}

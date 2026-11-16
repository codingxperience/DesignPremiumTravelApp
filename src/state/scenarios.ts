import { CAIRO_QUERY } from '@/data/demo'
import { returnFlightFor, searchFlights } from '@/data/flights'
import { makeFlightDraft } from '@/data/quotes'
import type { Route, Scenario } from './routes'

/**
 * Every screen of the prototype can be opened directly, either from the
 * presentation panel or with `?screen=<id>` in the URL. Each scenario rebuilds
 * the full navigation stack so that "back" behaves naturally.
 */

export const SCREEN_GROUPS = [
  {
    title: 'Welcome',
    screens: [
      { id: 'splash', label: 'Splash' },
      { id: 'onboarding', label: 'Onboarding' },
      { id: 'signin', label: 'Sign in' },
      { id: 'signup', label: 'Create account' },
      { id: 'verify', label: 'Verify number' },
    ],
  },
  {
    title: 'Explore',
    screens: [
      { id: 'home', label: 'Home' },
      { id: 'search', label: 'Search' },
      { id: 'destination', label: 'Destination' },
      { id: 'notifications', label: 'Notifications' },
    ],
  },
  {
    title: 'Book a flight',
    screens: [
      { id: 'flightSearch', label: 'Flight search' },
      { id: 'flightResults', label: 'Results' },
      { id: 'flightDetails', label: 'Fares' },
      { id: 'seats', label: 'Seat map' },
      { id: 'payment', label: 'Payment' },
      { id: 'success', label: 'Confirmation' },
    ],
  },
  {
    title: 'Services',
    screens: [
      { id: 'services', label: 'Services launcher' },
      { id: 'hotels', label: 'Hotels' },
      { id: 'holidays', label: 'Holidays' },
      { id: 'umrah', label: 'Umrah & Hajj' },
      { id: 'booking', label: 'Create booking' },
      { id: 'visa', label: 'Visa assistance' },
      { id: 'egypt', label: 'Egypt approval' },
      { id: 'application', label: 'Application' },
      { id: 'applicationStatus', label: 'Application status' },
    ],
  },
  {
    title: 'Trips & account',
    screens: [
      { id: 'trips', label: 'My trips' },
      { id: 'trip', label: 'Itinerary' },
      { id: 'ticket', label: 'E-ticket' },
      { id: 'support', label: 'Concierge chat' },
      { id: 'profile', label: 'Profile' },
      { id: 'saved', label: 'Saved places' },
      { id: 'documents', label: 'Documents' },
      { id: 'payments', label: 'Payment methods' },
    ],
  },
] as const

export type ScreenId = (typeof SCREEN_GROUPS)[number]['screens'][number]['id']

export const SCREEN_IDS: ScreenId[] = SCREEN_GROUPS.flatMap((group) => group.screens.map((screen) => screen.id))

export function isScreenId(value: string | null): value is ScreenId {
  return value !== null && (SCREEN_IDS as string[]).includes(value)
}

function flightStack(depth: 'search' | 'results' | 'details' | 'seats' | 'payment'): Route[] {
  const outbound = searchFlights(CAIRO_QUERY).find((f) => f.number === 'MS 778')!
  const inbound = returnFlightFor(outbound, CAIRO_QUERY)
  const selection = { outbound, inbound, fare: 'classic' as const, cabin: 'economy' as const, query: CAIRO_QUERY }
  const routes: Route[] = [
    { name: 'flightSearch', to: 'CAI' },
    { name: 'flightResults', query: CAIRO_QUERY },
    { name: 'flightDetails', query: CAIRO_QUERY, flightId: outbound.id },
    { name: 'seats', draft: makeFlightDraft(selection) },
    { name: 'payment', draft: makeFlightDraft({ ...selection, seat: '22A' }) },
  ]
  const length = { search: 1, results: 2, details: 3, seats: 4, payment: 5 }[depth]
  return routes.slice(0, length)
}

export function buildScenario(id: ScreenId): Scenario {
  const explore = (routes: Route[] = []): Scenario => ({ phase: 'app', tab: 'explore', routes })
  switch (id) {
    case 'splash':
      return { phase: 'splash' }
    case 'onboarding':
      return { phase: 'onboarding' }
    case 'signin':
    case 'signup':
    case 'verify':
      return { phase: 'auth', auth: id }
    case 'home':
      return explore()
    case 'search':
      return explore([{ name: 'search' }])
    case 'destination':
      return explore([{ name: 'destination', id: 'cairo' }])
    case 'notifications':
      return explore([{ name: 'notifications' }])
    case 'flightSearch':
      return explore(flightStack('search'))
    case 'flightResults':
      return explore(flightStack('results'))
    case 'flightDetails':
      return explore(flightStack('details'))
    case 'seats':
      return explore(flightStack('seats'))
    case 'payment':
      return explore(flightStack('payment'))
    case 'success':
      return explore([{ name: 'success', bookingId: 'bk-cairo' }])
    case 'services':
      return { ...explore(), servicesOpen: true }
    case 'hotels':
      return explore([{ name: 'hotels' }])
    case 'holidays':
      return explore([{ name: 'holidays' }])
    case 'umrah':
      return explore([{ name: 'umrah' }])
    case 'booking':
      return explore([{ name: 'umrah' }, { name: 'booking', item: { kind: 'package', packageId: 'umrah-comfort' } }])
    case 'visa':
      return explore([{ name: 'visa' }])
    case 'egypt':
      return explore([{ name: 'egypt' }])
    case 'application':
      return explore([{ name: 'egypt' }, { name: 'application', service: 'egypt', countryId: 'egypt' }])
    case 'applicationStatus':
      return { phase: 'app', tab: 'trips', routes: [{ name: 'applicationStatus', id: 'ap-egypt' }] }
    case 'trips':
      return { phase: 'app', tab: 'trips', routes: [] }
    case 'trip':
      return { phase: 'app', tab: 'trips', routes: [{ name: 'trip', bookingId: 'bk-cairo' }] }
    case 'ticket':
      return {
        phase: 'app',
        tab: 'trips',
        routes: [
          { name: 'trip', bookingId: 'bk-cairo' },
          { name: 'ticket', bookingId: 'bk-cairo' },
        ],
      }
    case 'support':
      return { phase: 'app', tab: 'support', routes: [] }
    case 'profile':
      return { phase: 'app', tab: 'profile', routes: [] }
    case 'saved':
      return { phase: 'app', tab: 'profile', routes: [{ name: 'saved' }] }
    case 'documents':
      return { phase: 'app', tab: 'profile', routes: [{ name: 'documents' }] }
    case 'payments':
      return { phase: 'app', tab: 'profile', routes: [{ name: 'payments' }] }
  }
}

/** Maps the live navigation state back to a screen id, to highlight it in the presentation panel. */
export function currentScreenId(state: {
  phase: Scenario['phase']
  auth: { screen: string }
  tab: string
  stack: { route: Route }[]
  servicesOpen: boolean
}): ScreenId | null {
  if (state.phase === 'splash') return 'splash'
  if (state.phase === 'onboarding') return 'onboarding'
  if (state.phase === 'auth') return state.auth.screen as ScreenId
  const top = state.stack[state.stack.length - 1]?.route
  if (!top) {
    if (state.servicesOpen) return 'services'
    return ({ explore: 'home', trips: 'trips', support: 'support', profile: 'profile' } as const)[state.tab as 'explore'] ?? null
  }
  const direct: Partial<Record<Route['name'], ScreenId>> = {
    search: 'search',
    notifications: 'notifications',
    destination: 'destination',
    flightSearch: 'flightSearch',
    flightResults: 'flightResults',
    flightDetails: 'flightDetails',
    seats: 'seats',
    booking: 'booking',
    payment: 'payment',
    success: 'success',
    ticket: 'ticket',
    trip: 'trip',
    hotels: 'hotels',
    holidays: 'holidays',
    umrah: 'umrah',
    visa: 'visa',
    egypt: 'egypt',
    application: 'application',
    applicationStatus: 'applicationStatus',
    saved: 'saved',
    documents: 'documents',
    payments: 'payments',
  }
  return direct[top.name] ?? null
}

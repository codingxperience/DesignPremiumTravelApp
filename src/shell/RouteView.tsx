import type { Route, Tab } from '@/state/routes'
import { BookingScreen } from '@/screens/booking/Booking'
import { PaymentScreen } from '@/screens/booking/Payment'
import { SuccessScreen } from '@/screens/booking/Success'
import { TicketScreen } from '@/screens/booking/Ticket'
import { DestinationScreen } from '@/screens/explore/Destination'
import { HomeScreen } from '@/screens/explore/Home'
import { NotificationsScreen } from '@/screens/explore/Notifications'
import { SearchScreen } from '@/screens/explore/Search'
import { FlightDetailsScreen } from '@/screens/flights/FlightDetails'
import { FlightResultsScreen } from '@/screens/flights/FlightResults'
import { FlightSearchScreen } from '@/screens/flights/FlightSearch'
import { SeatsScreen } from '@/screens/flights/Seats'
import { DocumentsScreen } from '@/screens/profile/Documents'
import { PaymentsScreen } from '@/screens/profile/Payments'
import { ProfileScreen } from '@/screens/profile/Profile'
import { SavedScreen } from '@/screens/profile/Saved'
import { ApplicationScreen } from '@/screens/services/Application'
import { ApplicationStatusScreen } from '@/screens/services/ApplicationStatus'
import { EgyptScreen } from '@/screens/services/Egypt'
import { HolidaysScreen } from '@/screens/services/Holidays'
import { HotelsScreen } from '@/screens/services/Hotels'
import { UmrahScreen } from '@/screens/services/Umrah'
import { VisaScreen } from '@/screens/services/Visa'
import { SupportScreen } from '@/screens/support/Support'
import { TripDetailScreen } from '@/screens/trips/TripDetail'
import { TripsScreen } from '@/screens/trips/Trips'

export function RouteView({ route }: { route: Route }) {
  switch (route.name) {
    case 'search':
      return <SearchScreen />
    case 'notifications':
      return <NotificationsScreen />
    case 'destination':
      return <DestinationScreen id={route.id} initialTab={route.tab} />
    case 'flightSearch':
      return <FlightSearchScreen to={route.to} />
    case 'flightResults':
      return <FlightResultsScreen query={route.query} />
    case 'flightDetails':
      return <FlightDetailsScreen query={route.query} flightId={route.flightId} />
    case 'seats':
      return <SeatsScreen draft={route.draft} />
    case 'booking':
      return <BookingScreen item={route.item} />
    case 'payment':
      return <PaymentScreen draft={route.draft} />
    case 'success':
      return <SuccessScreen bookingId={route.bookingId} />
    case 'ticket':
      return <TicketScreen bookingId={route.bookingId} />
    case 'trip':
      return <TripDetailScreen bookingId={route.bookingId} />
    case 'hotels':
      return <HotelsScreen cityId={route.cityId} />
    case 'holidays':
      return <HolidaysScreen />
    case 'umrah':
      return <UmrahScreen initialTab={route.tab} />
    case 'visa':
      return <VisaScreen />
    case 'egypt':
      return <EgyptScreen />
    case 'application':
      return <ApplicationScreen service={route.service} countryId={route.countryId} />
    case 'applicationStatus':
      return <ApplicationStatusScreen id={route.id} />
    case 'saved':
      return <SavedScreen />
    case 'documents':
      return <DocumentsScreen />
    case 'payments':
      return <PaymentsScreen />
  }
}

export function TabView({ tab }: { tab: Tab }) {
  switch (tab) {
    case 'explore':
      return <HomeScreen />
    case 'trips':
      return <TripsScreen />
    case 'support':
      return <SupportScreen />
    case 'profile':
      return <ProfileScreen />
  }
}

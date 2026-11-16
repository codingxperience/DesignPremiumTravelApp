import type { Localized } from '@/lib/i18n'

export type Category = 'city' | 'umrah' | 'holiday'
export type Inclusion = 'flight' | 'hotel' | 'transfer' | 'guide' | 'visa' | 'meals' | 'ziyarat'
export type FlagCode = 'gb' | 'eg' | 'sa' | 'ae' | 'tr' | 'us' | 'eu' | 'sd' | 'ma'

export type Destination = {
  id: string
  name: Localized
  region: Localized
  category: Category
  image: string
  gallery: string[]
  rating: number
  reviews: number
  priceFrom: number
  airport: string
  flightTime: Localized
  bestTime: Localized
  timezone: string
  currency: Localized
  description: Localized
  highlights: Localized[]
  visa: Localized
  weather: Localized
  language: Localized
  plugs: Localized
  packageIds: string[]
  visaService?: 'egypt' | 'visa'
  emergency?: { police: string; ambulance: string; tourist?: string }
}

export type PackageOption = { id: string; label: Localized; delta: number }
export type HolidayTheme = 'beach' | 'culture' | 'cruise' | 'nature'

export type TravelPackage = {
  id: string
  destinationId: string
  kind: Category
  theme?: HolidayTheme
  title: Localized
  summary: Localized
  nights: number
  image: string
  price: number
  includes: Inclusion[]
  board: Localized
  tag?: Localized
  options: PackageOption[]
  fixedDates?: { start: string; end: string }
}

export type Amenity = 'wifi' | 'pool' | 'breakfast' | 'spa' | 'view' | 'gym'

export type Hotel = {
  id: string
  cityId: string
  name: Localized
  area: Localized
  stars: number
  rating: number
  reviews: number
  image: string
  pricePerNight: number
  amenities: Amenity[]
  haramDistance?: number
}

export type Airport = {
  code: string
  city: Localized
  name: Localized
  /** UTC offset in hours during the northern winter. */
  tz: number
  uk?: boolean
}

export type Cabin = 'economy' | 'premium' | 'business' | 'first'
export type FareId = 'light' | 'classic' | 'flex'

export type FlightQuery = {
  tripType: 'return' | 'oneway'
  from: string
  to: string
  depart: string
  ret?: string
  adults: number
  children: number
  infants: number
  cabin: Cabin
}

export type Airline = { code: string; name: Localized; color: string; ink: string }

export type Flight = {
  id: string
  airline: Airline
  number: string
  from: string
  to: string
  date: string
  dep: string
  arr: string
  dayOffset: number
  durationMin: number
  stops: number
  via?: string
  /** Economy Classic fare per adult, in pounds. */
  price: number
  aircraft: string
  depTerminal: string
  arrTerminal: string
}

export type PriceLine = { label: Localized; amount: number }

export type FlightSelection = {
  outbound: Flight
  inbound?: Flight
  fare: FareId
  cabin: Cabin
  seat?: string
  query: FlightQuery
}

export type BookingDraft = {
  kind: 'flight' | 'package' | 'hotel'
  title: Localized
  subtitle: Localized
  image: string
  destinationId?: string
  startDate: string
  endDate?: string
  adults: number
  children: number
  lines: PriceLine[]
  total: number
  flight?: FlightSelection
  hotelId?: string
  packageId?: string
}

export type ItineraryDay = {
  label: Localized
  title: Localized
  items: { time?: string; text: Localized }[]
}

export type Booking = BookingDraft & {
  id: string
  ref: string
  status: 'confirmed' | 'deposit'
  createdAt: number
  isNew?: boolean
  itinerary?: ItineraryDay[]
  balanceDue?: string
  rating?: number
}

export type ApplicationStatus = 'submitted' | 'documents' | 'review' | 'approved'

export type Application = {
  id: string
  ref: string
  service: 'egypt' | 'visa'
  countryId: string
  applicant: string
  status: ApplicationStatus
  fee: number
  submittedAt: number
  updatedAt: number
  travelDate: string
  isNew?: boolean
}

export type ChatMessage = {
  id: string
  from: 'agent' | 'user'
  at: number
  text?: string
  key?: import('@/lib/i18n').TKey
  /** ISO date substituted into `{date}` when the message is rendered. */
  dateParam?: string
  card?: 'approval'
  read?: boolean
}

export type NotificationTarget = 'application' | 'istanbul' | 'trip-cairo' | 'trip-umrah' | 'offers'

export type AppNotification = {
  id: string
  icon: 'approval' | 'price' | 'checkin' | 'payment' | 'welcome'
  title: Localized
  body: Localized
  at: number
  target: NotificationTarget
}

export type PaymentCard = { id: string; brand: 'Visa' | 'Mastercard' | 'Amex'; last4: string; expiry: string }

export type VisaCountry = {
  id: string
  flag: FlagCode
  name: Localized
  type: Localized
  processingDays: number
  fee: number
  destinationId?: string
}

import { formatMoney } from '@/lib/format'
import { PHOTOS } from '@/lib/images'
import { translate, translatePlural, type Lang, type Localized, type TKey } from '@/lib/i18n'
import { getAirport } from './airports'
import { DESTINATIONS, getDestination } from './destinations'
import { farePrice, passengersTotal, seatPrice } from './flights'
import { HOTEL_OPTIONS } from './hotels'
import type { BookingDraft, Cabin, FareId, FlightSelection, Hotel, ItineraryDay, PriceLine, TravelPackage } from './types'

/** Builds a value in both languages so stored bookings survive a language switch. */
export function both(build: (lang: Lang) => string): Localized {
  return { en: build('en'), ar: build('ar') }
}

export function sumLines(lines: PriceLine[]): number {
  return lines.reduce((total, line) => total + line.amount, 0)
}

export function routeTitle(from: string, to: string): Localized {
  return both((lang) => `${getAirport(from).city[lang]} ${lang === 'ar' ? '←' : '→'} ${getAirport(to).city[lang]}`)
}

export function cabinFareLabel(lang: Lang, cabin: Cabin, fare: FareId): string {
  return `${translate(lang, `flights.cabin.${cabin}` as TKey)} · ${translate(lang, `fare.${fare}` as TKey)}`
}

export function makeFlightDraft(selection: FlightSelection): BookingDraft {
  const { outbound, query, fare, cabin, seat } = selection
  const lines: PriceLine[] = [
    {
      label: both((lang) => translate(lang, 'booking.line.flight', { fare: cabinFareLabel(lang, cabin, fare) })),
      amount: passengersTotal(farePrice(outbound, fare), query),
    },
  ]
  if (seat) {
    const price = seatPrice(fare, seat.startsWith('18'))
    if (price > 0) lines.push({ label: both((lang) => translate(lang, 'booking.line.seat', { seat })), amount: price })
  }
  const destination = DESTINATIONS.find((d) => d.airport === query.to) ?? DESTINATIONS.find((d) => d.airport === query.from)
  return {
    kind: 'flight',
    title: routeTitle(query.from, query.to),
    subtitle: both((lang) => `${outbound.airline.name[lang]} · ${outbound.number}`),
    image: destination?.image ?? PHOTOS.wingSunset,
    destinationId: destination?.id,
    startDate: query.depart,
    endDate: query.tripType === 'return' ? query.ret : undefined,
    adults: query.adults,
    children: query.children + query.infants,
    lines,
    total: sumLines(lines),
    flight: selection,
  }
}

export type PackageExtras = { insurance: boolean; lounge: boolean; visa: boolean }
export const PACKAGE_EXTRA_PRICES = { insurance: 19, lounge: 32, visa: 45 } as const

export function packageQuote(
  travelPackage: TravelPackage,
  options: { adults: number; children: number; optionId: string; extras: PackageExtras },
): PriceLine[] {
  const { adults, children, extras } = options
  const travellers = adults + children
  const option = travelPackage.options.find((o) => o.id === options.optionId) ?? travelPackage.options[0]
  const lines: PriceLine[] = [
    { label: both((lang) => translate(lang, 'booking.line.package', { n: adults })), amount: travelPackage.price * adults },
  ]
  if (children > 0) {
    lines.push({
      label: both((lang) => translate(lang, 'booking.line.children', { n: children })),
      amount: Math.round(travelPackage.price * 0.7) * children,
    })
  }
  if (option.delta > 0) {
    lines.push({
      label: both((lang) => translate(lang, 'booking.line.option', { option: option.label[lang] })),
      amount: option.delta * travellers,
    })
  }
  const extraKeys: Array<[keyof PackageExtras, TKey]> = [
    ['insurance', 'booking.extra.insurance'],
    ['lounge', 'booking.extra.lounge'],
    ['visa', 'booking.extra.visa'],
  ]
  for (const [extra, key] of extraKeys) {
    if (extra === 'visa' && travelPackage.includes.includes('visa')) continue
    if (extras[extra]) {
      lines.push({ label: both((lang) => translate(lang, key)), amount: PACKAGE_EXTRA_PRICES[extra] * travellers })
    }
  }
  return lines
}

export function generateItinerary(destinationId: string, nights: number): ItineraryDay[] {
  const destination = getDestination(destinationId)
  const city = destination.name
  const lastDay = nights + 1
  return [
    {
      label: both((lang) => translate(lang, 'trip.day', { n: 1 })),
      title: both((lang) => translate(lang, 'trip.arrive', { city: city[lang] })),
      items: [{ text: both((lang) => translate(lang, 'trip.meet')) }],
    },
    {
      label: both((lang) => translate(lang, 'trip.days', { a: 2, b: nights })),
      title: both((lang) => translate(lang, 'trip.explore', { city: city[lang] })),
      items: destination.highlights.map((highlight) => ({ text: highlight })),
    },
    {
      label: both((lang) => translate(lang, 'trip.day', { n: lastDay })),
      title: both((lang) => translate(lang, 'trip.flyHome')),
      items: [{ text: both((lang) => translate(lang, 'trip.departTransfer')) }],
    },
  ]
}

export function makePackageDraft(
  travelPackage: TravelPackage,
  options: { adults: number; children: number; optionId: string; extras: PackageExtras; startDate: string; endDate: string },
): BookingDraft {
  const lines = packageQuote(travelPackage, options)
  const destination = getDestination(travelPackage.destinationId)
  const option = travelPackage.options.find((o) => o.id === options.optionId) ?? travelPackage.options[0]
  return {
    kind: 'package',
    title: travelPackage.title,
    subtitle: both((lang) => `${destination.name[lang]} · ${option.label[lang]}`),
    image: travelPackage.image,
    destinationId: destination.id,
    packageId: travelPackage.id,
    startDate: options.startDate,
    endDate: options.endDate,
    adults: options.adults,
    children: options.children,
    lines,
    total: sumLines(lines),
  }
}

export type HotelExtras = { transfer: boolean; insurance: boolean }
export const HOTEL_EXTRA_PRICES = { transfer: 35, insurance: 19 } as const

export function hotelQuote(
  hotel: Hotel,
  options: { nights: number; adults: number; optionId: string; extras: HotelExtras },
): PriceLine[] {
  const option = HOTEL_OPTIONS.find((o) => o.id === options.optionId) ?? HOTEL_OPTIONS[0]
  const rooms = Math.max(1, Math.ceil(options.adults / 2))
  const nightly = hotel.pricePerNight + option.delta
  const lines: PriceLine[] = [
    {
      label: both(
        (lang) =>
          `${translate(lang, option.key)} · ${translatePlural(lang, 'booking.rooms', rooms)} · ${translate(lang, 'booking.line.hotel', {
            nights: translatePlural(lang, 'common.nights', options.nights),
            price: formatMoney(nightly),
          })}`,
      ),
      amount: nightly * options.nights * rooms,
    },
  ]
  if (options.extras.transfer) {
    lines.push({ label: both((lang) => translate(lang, 'booking.extra.transfer')), amount: HOTEL_EXTRA_PRICES.transfer })
  }
  if (options.extras.insurance) {
    lines.push({
      label: both((lang) => translate(lang, 'booking.extra.insurance')),
      amount: HOTEL_EXTRA_PRICES.insurance * options.adults,
    })
  }
  return lines
}

export function makeHotelDraft(
  hotel: Hotel,
  options: { nights: number; adults: number; optionId: string; extras: HotelExtras; startDate: string; endDate: string },
): BookingDraft {
  const lines = hotelQuote(hotel, options)
  return {
    kind: 'hotel',
    title: hotel.name,
    subtitle: hotel.area,
    image: hotel.image,
    destinationId: hotel.cityId,
    hotelId: hotel.id,
    startDate: options.startDate,
    endDate: options.endDate,
    adults: options.adults,
    children: 0,
    lines,
    total: sumLines(lines),
  }
}

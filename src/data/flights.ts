import { minutesToTime, timeToMinutes } from '@/lib/dates'
import { getAirport } from './airports'
import type { Airline, Cabin, FareId, Flight, FlightQuery } from './types'

/**
 * Deterministic fare generator. The same route and date always produce the
 * same schedule and prices, so the prototype behaves like a real search
 * without a backend.
 */

export const AIRLINES = {
  MS: { code: 'MS', name: { en: 'EgyptAir', ar: 'مصر للطيران' }, color: '#0B2A5B', ink: '#E9C46A' },
  BA: { code: 'BA', name: { en: 'British Airways', ar: 'الخطوط الجوية البريطانية' }, color: '#1D4F9E', ink: '#FFFFFF' },
  TK: { code: 'TK', name: { en: 'Turkish Airlines', ar: 'الخطوط الجوية التركية' }, color: '#C8102E', ink: '#FFFFFF' },
  SV: { code: 'SV', name: { en: 'Saudia', ar: 'الخطوط السعودية' }, color: '#0D6B4E', ink: '#FFFFFF' },
  EK: { code: 'EK', name: { en: 'Emirates', ar: 'طيران الإمارات' }, color: '#D71A21', ink: '#FFFFFF' },
  QR: { code: 'QR', name: { en: 'Qatar Airways', ar: 'الخطوط الجوية القطرية' }, color: '#5C0632', ink: '#FFFFFF' },
  AT: { code: 'AT', name: { en: 'Royal Air Maroc', ar: 'الخطوط الملكية المغربية' }, color: '#B3122E', ink: '#FFFFFF' },
} satisfies Record<string, Airline>

type AirlineCode = keyof typeof AIRLINES

type Template = {
  airline: AirlineCode
  number: number
  dep: string
  dur: number
  stops: number
  via?: string
  factor: number
  aircraft: string
  depT: string
  arrT: string
}

const ROUTES: Record<string, { base: number; templates: Template[] }> = {
  CAI: {
    base: 389,
    templates: [
      { airline: 'MS', number: 778, dep: '10:30', dur: 290, stops: 0, factor: 1.08, aircraft: 'Boeing 787-9', depT: '2', arrT: '3' },
      { airline: 'BA', number: 155, dep: '14:05', dur: 295, stops: 0, factor: 1.22, aircraft: 'Airbus A321neo', depT: '5', arrT: '2' },
      { airline: 'TK', number: 1972, dep: '06:55', dur: 585, stops: 1, via: 'IST', factor: 1, aircraft: 'Airbus A321neo', depT: '2', arrT: '2' },
      { airline: 'MS', number: 780, dep: '21:45', dur: 285, stops: 0, factor: 1.04, aircraft: 'Airbus A320neo', depT: '2', arrT: '3' },
    ],
  },
  JED: {
    base: 452,
    templates: [
      { airline: 'SV', number: 116, dep: '11:40', dur: 370, stops: 0, factor: 1.06, aircraft: 'Boeing 777-300ER', depT: '4', arrT: '1' },
      { airline: 'MS', number: 778, dep: '10:30', dur: 560, stops: 1, via: 'CAI', factor: 1, aircraft: 'Boeing 787-9', depT: '2', arrT: '1' },
      { airline: 'TK', number: 1980, dep: '07:25', dur: 610, stops: 1, via: 'IST', factor: 1.04, aircraft: 'Airbus A350-900', depT: '2', arrT: '1' },
      { airline: 'SV', number: 104, dep: '21:15', dur: 365, stops: 0, factor: 1.02, aircraft: 'Boeing 787-10', depT: '4', arrT: '1' },
    ],
  },
  MED: {
    base: 489,
    templates: [
      { airline: 'SV', number: 130, dep: '13:20', dur: 400, stops: 0, factor: 1.08, aircraft: 'Boeing 787-9', depT: '4', arrT: '1' },
      { airline: 'TK', number: 1980, dep: '07:25', dur: 640, stops: 1, via: 'IST', factor: 1, aircraft: 'Airbus A350-900', depT: '2', arrT: '1' },
      { airline: 'MS', number: 778, dep: '10:30', dur: 610, stops: 1, via: 'CAI', factor: 1.02, aircraft: 'Boeing 787-9', depT: '2', arrT: '1' },
    ],
  },
  DXB: {
    base: 329,
    templates: [
      { airline: 'EK', number: 2, dep: '08:30', dur: 415, stops: 0, factor: 1.12, aircraft: 'Airbus A380', depT: '3', arrT: '3' },
      { airline: 'BA', number: 107, dep: '14:15', dur: 420, stops: 0, factor: 1.06, aircraft: 'Boeing 777-300ER', depT: '5', arrT: '1' },
      { airline: 'EK', number: 4, dep: '21:20', dur: 410, stops: 0, factor: 1.04, aircraft: 'Airbus A380', depT: '3', arrT: '3' },
      { airline: 'TK', number: 1986, dep: '06:55', dur: 650, stops: 1, via: 'IST', factor: 1, aircraft: 'Airbus A321neo', depT: '2', arrT: '1' },
    ],
  },
  IST: {
    base: 119,
    templates: [
      { airline: 'TK', number: 1980, dep: '07:25', dur: 235, stops: 0, factor: 1.08, aircraft: 'Airbus A350-900', depT: '2', arrT: 'M' },
      { airline: 'BA', number: 680, dep: '11:45', dur: 240, stops: 0, factor: 1.2, aircraft: 'Airbus A320neo', depT: '5', arrT: 'M' },
      { airline: 'TK', number: 1986, dep: '18:40', dur: 230, stops: 0, factor: 1, aircraft: 'Boeing 737 MAX 9', depT: '2', arrT: 'M' },
    ],
  },
  ZNZ: {
    base: 612,
    templates: [
      { airline: 'QR', number: 4, dep: '08:25', dur: 760, stops: 1, via: 'DOH', factor: 1.06, aircraft: 'Airbus A350-1000', depT: '4', arrT: '3' },
      { airline: 'TK', number: 1984, dep: '13:25', dur: 755, stops: 1, via: 'IST', factor: 1, aircraft: 'Airbus A330-300', depT: '2', arrT: '3' },
      { airline: 'EK', number: 6, dep: '20:40', dur: 790, stops: 1, via: 'DXB', factor: 1.04, aircraft: 'Boeing 777-300ER', depT: '3', arrT: '3' },
    ],
  },
  RAK: {
    base: 149,
    templates: [
      { airline: 'BA', number: 2672, dep: '09:40', dur: 225, stops: 0, factor: 1.12, aircraft: 'Airbus A320', depT: '5', arrT: '1' },
      { airline: 'AT', number: 801, dep: '12:20', dur: 330, stops: 1, via: 'CMN', factor: 1, aircraft: 'Boeing 737-800', depT: '4', arrT: '1' },
      { airline: 'BA', number: 2674, dep: '17:10', dur: 225, stops: 0, factor: 1.06, aircraft: 'Airbus A320neo', depT: '5', arrT: '1' },
    ],
  },
  CPT: {
    base: 689,
    templates: [
      { airline: 'BA', number: 59, dep: '20:50', dur: 700, stops: 0, factor: 1.1, aircraft: 'Boeing 777-300ER', depT: '5', arrT: 'A' },
      { airline: 'QR', number: 2, dep: '08:25', dur: 1180, stops: 1, via: 'DOH', factor: 1, aircraft: 'Boeing 787-9', depT: '4', arrT: 'A' },
      { airline: 'EK', number: 8, dep: '14:30', dur: 1260, stops: 1, via: 'DXB', factor: 1.02, aircraft: 'Airbus A380', depT: '3', arrT: 'A' },
    ],
  },
  SSH: {
    base: 349,
    templates: [
      { airline: 'BA', number: 2611, dep: '09:05', dur: 310, stops: 0, factor: 1.1, aircraft: 'Airbus A320neo', depT: '5', arrT: '1' },
      { airline: 'MS', number: 778, dep: '10:30', dur: 520, stops: 1, via: 'CAI', factor: 1, aircraft: 'Boeing 787-9', depT: '2', arrT: '1' },
    ],
  },
  LXR: {
    base: 429,
    templates: [
      { airline: 'MS', number: 778, dep: '10:30', dur: 515, stops: 1, via: 'CAI', factor: 1, aircraft: 'Boeing 787-9', depT: '2', arrT: '1' },
      { airline: 'TK', number: 1972, dep: '06:55', dur: 650, stops: 1, via: 'IST', factor: 1.06, aircraft: 'Airbus A321neo', depT: '2', arrT: '1' },
    ],
  },
  MLE: {
    base: 795,
    templates: [
      { airline: 'BA', number: 61, dep: '13:25', dur: 630, stops: 0, factor: 1.12, aircraft: 'Boeing 777-200ER', depT: '5', arrT: '1' },
      { airline: 'EK', number: 2, dep: '08:30', dur: 1000, stops: 1, via: 'DXB', factor: 1, aircraft: 'Airbus A380', depT: '3', arrT: '1' },
      { airline: 'QR', number: 4, dep: '08:25', dur: 980, stops: 1, via: 'DOH', factor: 1.04, aircraft: 'Airbus A350-1000', depT: '4', arrT: '1' },
    ],
  },
  PZU: {
    base: 540,
    templates: [
      { airline: 'MS', number: 778, dep: '10:30', dur: 640, stops: 1, via: 'CAI', factor: 1, aircraft: 'Boeing 787-9', depT: '2', arrT: '1' },
      { airline: 'SV', number: 116, dep: '11:40', dur: 610, stops: 1, via: 'JED', factor: 1.04, aircraft: 'Boeing 777-300ER', depT: '4', arrT: '1' },
      { airline: 'TK', number: 1972, dep: '06:55', dur: 720, stops: 1, via: 'IST', factor: 1.06, aircraft: 'Airbus A321neo', depT: '2', arrT: '1' },
    ],
  },
}

const ORIGIN_ADJUST: Record<string, { shift: number; factor: number; terminal?: string }> = {
  LHR: { shift: 0, factor: 1 },
  LGW: { shift: 35, factor: 1.03, terminal: 'N' },
  MAN: { shift: 70, factor: 1.07, terminal: '2' },
}

export const CABIN_MULTIPLIER: Record<Cabin, number> = { economy: 1, premium: 1.7, business: 3.3, first: 5.4 }
export const FARE_MULTIPLIER: Record<FareId, number> = { light: 0.9, classic: 1, flex: 1.24 }
const ONE_WAY_FACTOR = 0.62

function hash(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Small seeded PRNG (mulberry32). */
function random(seed: string): () => number {
  let a = hash(seed)
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildFlight(
  template: Template,
  options: { from: string; to: string; date: string; dep: number; dur: number; number: number; price: number; depT: string; arrT: string },
): Flight {
  const fromTz = getAirport(options.from).tz
  const toTz = getAirport(options.to).tz
  const arrival = options.dep + options.dur + (toTz - fromTz) * 60
  const airline = AIRLINES[template.airline]
  return {
    id: `${options.from}-${options.to}-${options.date}-${airline.code}${options.number}`,
    airline,
    number: `${airline.code} ${options.number}`,
    from: options.from,
    to: options.to,
    date: options.date,
    dep: minutesToTime(options.dep),
    arr: minutesToTime(arrival),
    dayOffset: Math.floor(arrival / 1440),
    durationMin: options.dur,
    stops: template.stops,
    via: template.via,
    price: options.price,
    aircraft: template.aircraft,
    depTerminal: options.depT,
    arrTerminal: options.arrT,
  }
}

function basePrice(route: { base: number }, template: Template, seed: string, query: FlightQuery, originFactor: number) {
  const dateFactor = 0.96 + random(seed)() * 0.2
  const tripFactor = query.tripType === 'oneway' ? ONE_WAY_FACTOR : 1
  return Math.round(route.base * template.factor * dateFactor * CABIN_MULTIPLIER[query.cabin] * originFactor * tripFactor)
}

/** Flights for a query on a given date (defaults to the departure date). */
export function searchFlights(query: FlightQuery, date: string = query.depart): Flight[] {
  const from = getAirport(query.from)
  const to = getAirport(query.to)

  if (from.uk && !to.uk) {
    const route = ROUTES[to.code]
    if (!route) return []
    const origin = ORIGIN_ADJUST[from.code] ?? ORIGIN_ADJUST.LHR
    return route.templates.map((template) =>
      buildFlight(template, {
        from: from.code,
        to: to.code,
        date,
        dep: timeToMinutes(template.dep) + origin.shift,
        dur: template.dur,
        number: template.number,
        price: basePrice(route, template, `${from.code}${to.code}${date}${template.number}`, query, origin.factor),
        depT: origin.terminal ?? template.depT,
        arrT: template.arrT,
      }),
    )
  }

  if (!from.uk && to.uk) {
    const route = ROUTES[from.code]
    if (!route) return []
    const origin = ORIGIN_ADJUST[to.code] ?? ORIGIN_ADJUST.LHR
    return route.templates.map((template) => {
      // Direct aircraft turn around after landing; connecting itineraries leave mid-morning.
      const outboundArrival = timeToMinutes(template.dep) + template.dur + from.tz * 60
      const dep = template.stops === 0 ? (outboundArrival + 80) % 1440 : (timeToMinutes(template.dep) + 150) % 1440
      const number = template.number % 2 === 0 ? template.number - 1 : template.number + 1
      return buildFlight(template, {
        from: from.code,
        to: to.code,
        date,
        dep,
        dur: template.dur + 25,
        number,
        price: basePrice(route, template, `${from.code}${to.code}${date}${number}`, query, origin.factor),
        depT: template.arrT,
        arrT: origin.terminal ?? template.depT,
      })
    })
  }

  return []
}

export function findFlight(query: FlightQuery, id: string): Flight | undefined {
  return searchFlights(query).find((flight) => flight.id === id)
}

/** The matching return flight for a round trip, preferring the same airline. */
export function returnFlightFor(outbound: Flight, query: FlightQuery): Flight | undefined {
  if (query.tripType !== 'return' || !query.ret) return undefined
  const inbound = searchFlights({ ...query, from: query.to, to: query.from }, query.ret)
  return inbound.find((f) => f.airline.code === outbound.airline.code && f.stops === outbound.stops) ?? inbound[0]
}

export function cheapestPrice(query: FlightQuery, date: string): number | null {
  const flights = searchFlights(query, date)
  return flights.length ? Math.min(...flights.map((f) => farePrice(f, 'light'))) : null
}

export function farePrice(flight: Flight, fare: FareId): number {
  return Math.round(flight.price * FARE_MULTIPLIER[fare])
}

/** Total for every passenger on the query; children pay 75% and infants 10%. */
export function passengersTotal(perAdult: number, query: Pick<FlightQuery, 'adults' | 'children' | 'infants'>): number {
  return Math.round(perAdult * query.adults + perAdult * 0.75 * query.children + perAdult * 0.1 * query.infants)
}

export function seatPrice(fare: FareId, legroom: boolean): number {
  if (fare === 'light') return legroom ? 35 : 12
  return legroom ? 25 : 0
}

export type SeatRow = { row: number; legroom: boolean; seats: { id: string; letter: string; taken: boolean }[] }

const SEAT_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']
const KEEP_FREE = new Set(['22A', '22B', '23F', '18C', '25D'])

export function seatMap(flightId: string): SeatRow[] {
  const next = random(`seats-${flightId}`)
  const rows: SeatRow[] = []
  for (let row = 18; row <= 31; row++) {
    rows.push({
      row,
      legroom: row === 18,
      seats: SEAT_LETTERS.map((letter) => {
        const id = `${row}${letter}`
        return { id, letter, taken: !KEEP_FREE.has(id) && next() < 0.46 }
      }),
    })
  }
  return rows
}

export function seatType(letter: string): 'window' | 'aisle' | 'middle' {
  if (letter === 'A' || letter === 'F') return 'window'
  if (letter === 'C' || letter === 'D') return 'aisle'
  return 'middle'
}

/** Overall score used by the "Best" sort: cheaper, shorter and direct flights rank higher. */
export function bestScore(flight: Flight): number {
  return flight.price / 10 + flight.durationMin / 12 + flight.stops * 30
}

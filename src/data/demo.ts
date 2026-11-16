import { fromToday, minutesAgo } from '@/lib/dates'
import { PHOTOS } from '@/lib/images'
import { returnFlightFor, searchFlights } from './flights'
import { getPackage } from './packages'
import { both, cabinFareLabel, generateItinerary, sumLines } from './quotes'
import type { AppNotification, Application, Booking, ChatMessage, FlightQuery, ItineraryDay, PaymentCard, PriceLine } from './types'
import { translate } from '@/lib/i18n'

/** The signed-in demo traveller. */
export const USER = {
  name: 'Ahmed Mohamed',
  firstName: { en: 'Ahmed', ar: 'أحمد' },
  email: 'ahmed.mohamed@email.com',
  phoneMasked: '+44 7700 ••• 274',
  passportLast4: '4521',
  passportExpiry: '2031-08-14',
  residenceExpiry: '2029-03-02',
  city: { en: 'London, United Kingdom', ar: 'لندن، المملكة المتحدة' },
  memberSince: 2024,
  avatar: PHOTOS.ahmed,
}

export const CONTACT = {
  phone: '+44 7393 877430',
  phoneHref: 'tel:+447393877430',
  whatsappHref: 'https://wa.me/447393877430',
  email: 'cwt@crossworldtravelagency.com',
  emailHref: 'mailto:cwt@crossworldtravelagency.com',
  website: 'crossworldtravelagency.com',
  websiteHref: 'https://crossworldtravelagency.com',
}

const day = (n: number) => both((lang) => translate(lang, 'trip.day', { n }))
const days = (a: number, b: number) => both((lang) => translate(lang, 'trip.days', { a, b }))

// ---- Upcoming Cairo trip: flights + hotel ----------------------------------

const cairoStart = fromToday(18)
const cairoEnd = fromToday(23)

export const CAIRO_QUERY: FlightQuery = {
  tripType: 'return',
  from: 'LHR',
  to: 'CAI',
  depart: cairoStart,
  ret: cairoEnd,
  adults: 1,
  children: 0,
  infants: 0,
  cabin: 'economy',
}

const cairoOutbound = searchFlights(CAIRO_QUERY).find((f) => f.number === 'MS 778')!
const cairoInbound = returnFlightFor(cairoOutbound, CAIRO_QUERY)

const cairoLines: PriceLine[] = [
  {
    label: both((lang) => translate(lang, 'booking.line.flight', { fare: cabinFareLabel(lang, 'economy', 'classic') })),
    amount: cairoOutbound.price,
  },
  { label: { en: 'Giza Pyramids View Hotel · 5 nights', ar: 'فندق إطلالة أهرامات الجيزة · 5 ليالٍ' }, amount: 480 },
  { label: both((lang) => translate(lang, 'booking.extra.transfer')), amount: 35 },
  { label: both((lang) => translate(lang, 'booking.extra.insurance')), amount: 19 },
]

const cairoItinerary: ItineraryDay[] = [
  {
    label: day(1),
    title: { en: 'Arrive in Cairo', ar: 'الوصول إلى القاهرة' },
    items: [
      { time: cairoOutbound.arr, text: { en: 'Land at Cairo International, Terminal 3', ar: 'الوصول إلى مطار القاهرة الدولي، مبنى 3' } },
      { time: '18:45', text: { en: 'Private transfer to Giza Pyramids View Hotel', ar: 'تنقل خاص إلى فندق إطلالة أهرامات الجيزة' } },
      { time: '20:30', text: { en: 'Dinner on the terrace facing the pyramids', ar: 'عشاء على التراس المطل على الأهرامات' } },
    ],
  },
  {
    label: day(2),
    title: { en: 'Pyramids & the Sphinx', ar: 'الأهرامات وأبو الهول' },
    items: [
      { time: '08:30', text: { en: 'Guided tour of the Great Pyramid, Khafre and the Sphinx', ar: 'جولة بمرشد في الهرم الأكبر وهرم خفرع وأبي الهول' } },
      { time: '13:00', text: { en: 'Lunch overlooking the Giza plateau', ar: 'غداء مطل على هضبة الجيزة' } },
      { time: '15:30', text: { en: 'Grand Egyptian Museum', ar: 'المتحف المصري الكبير' } },
    ],
  },
  {
    label: day(3),
    title: { en: 'Islamic & Old Cairo', ar: 'القاهرة الإسلامية والقديمة' },
    items: [
      { time: '09:30', text: { en: 'The Citadel and the Mosque of Muhammad Ali', ar: 'القلعة ومسجد محمد علي' } },
      { time: '13:00', text: { en: 'Al-Azhar Park and Al-Azhar Mosque', ar: 'حديقة الأزهر والجامع الأزهر' } },
      { time: '17:00', text: { en: 'Khan el-Khalili bazaar at golden hour', ar: 'خان الخليلي في ساعة الغروب' } },
    ],
  },
  {
    label: day(4),
    title: { en: 'Saqqara & Memphis', ar: 'سقارة وممفيس' },
    items: [
      { time: '09:00', text: { en: 'Step Pyramid of Djoser', ar: 'هرم زوسر المدرّج' } },
      { time: '12:30', text: { en: 'Memphis open-air museum', ar: 'متحف ممفيس المفتوح' } },
      { time: '19:30', text: { en: 'Dinner cruise on the Nile', ar: 'عشاء على متن رحلة نيلية' } },
    ],
  },
  {
    label: day(5),
    title: { en: 'A day at your pace', ar: 'يوم على راحتك' },
    items: [
      {
        text: {
          en: 'Spa morning, shopping in Zamalek or an optional day trip to Alexandria',
          ar: 'صباح في السبا، أو تسوّق في الزمالك، أو رحلة اختيارية إلى الإسكندرية',
        },
      },
    ],
  },
  {
    label: day(6),
    title: { en: 'Fly home', ar: 'العودة إلى الوطن' },
    items: [
      { time: '12:00', text: { en: 'Late checkout and lunch by the pool', ar: 'مغادرة متأخرة وغداء بجوار المسبح' } },
      { time: '15:30', text: { en: 'Private transfer to Cairo International', ar: 'تنقل خاص إلى مطار القاهرة الدولي' } },
      {
        time: cairoInbound?.dep,
        text: { en: `EgyptAir ${cairoInbound?.number ?? ''} to London Heathrow`, ar: `رحلة مصر للطيران ${cairoInbound?.number ?? ''} إلى لندن هيثرو` },
      },
    ],
  },
]

const cairoBooking: Booking = {
  id: 'bk-cairo',
  ref: 'CW-48213',
  status: 'confirmed',
  createdAt: minutesAgo(60 * 24 * 12).getTime(),
  kind: 'flight',
  title: { en: 'Cairo & Giza', ar: 'القاهرة والجيزة' },
  subtitle: { en: 'Flights + 5 nights · Giza Pyramids View Hotel', ar: 'طيران + 5 ليالٍ · فندق إطلالة أهرامات الجيزة' },
  image: PHOTOS.sphinxPyramid,
  destinationId: 'cairo',
  hotelId: 'giza-view',
  startDate: cairoStart,
  endDate: cairoEnd,
  adults: 1,
  children: 0,
  lines: cairoLines,
  total: sumLines(cairoLines),
  flight: { outbound: cairoOutbound, inbound: cairoInbound, fare: 'classic', cabin: 'economy', seat: '22A', query: CAIRO_QUERY },
  itinerary: cairoItinerary,
}

// ---- Ramadan Umrah: deposit paid --------------------------------------------

const ramadan = getPackage('umrah-ramadan')
const umrahLines: PriceLine[] = [
  { label: both((lang) => translate(lang, 'booking.line.package', { n: 2 })), amount: ramadan.price * 2 },
]

const umrahBooking: Booking = {
  id: 'bk-umrah',
  ref: 'CW-47790',
  status: 'deposit',
  createdAt: minutesAgo(60 * 24 * 3).getTime(),
  kind: 'package',
  title: ramadan.title,
  subtitle: { en: 'Makkah & Madinah · Quad room', ar: 'مكة المكرمة والمدينة المنورة · غرفة رباعية' },
  image: PHOTOS.kaaba,
  destinationId: 'makkah',
  packageId: ramadan.id,
  startDate: ramadan.fixedDates!.start,
  endDate: ramadan.fixedDates!.end,
  adults: 2,
  children: 0,
  lines: umrahLines,
  total: sumLines(umrahLines),
  balanceDue: '2027-01-15',
  itinerary: [
    {
      label: day(1),
      title: { en: 'Arrive in Jeddah', ar: 'الوصول إلى جدة' },
      items: [
        { text: { en: 'Meet & greet, then a private transfer to Makkah', ar: 'استقبال ثم تنقل خاص إلى مكة المكرمة' } },
        { text: { en: 'Perform Umrah with your group guide', ar: 'أداء العمرة مع مرشد المجموعة' } },
      ],
    },
    {
      label: days(2, 8),
      title: { en: 'Makkah', ar: 'مكة المكرمة' },
      items: [
        { text: { en: 'Prayers at Masjid al-Haram, steps from your hotel', ar: 'الصلاة في المسجد الحرام على بُعد خطوات من فندقك' } },
        { text: { en: 'Suhoor and iftar served daily', ar: 'السحور والإفطار يوميًا' } },
        { text: { en: 'Guided ziyarat to Jabal al-Nour and Arafat', ar: 'زيارات بمرشد إلى جبل النور وعرفات' } },
      ],
    },
    {
      label: day(9),
      title: { en: 'To Madinah', ar: 'إلى المدينة المنورة' },
      items: [{ text: { en: 'Haramain high-speed train to Madinah', ar: 'قطار الحرمين السريع إلى المدينة المنورة' } }],
    },
    {
      label: days(10, 12),
      title: { en: 'Madinah', ar: 'المدينة المنورة' },
      items: [
        { text: { en: 'Prayers at Al-Masjid an-Nabawi', ar: 'الصلاة في المسجد النبوي' } },
        { text: { en: 'Ziyarat to Quba Mosque and Mount Uhud', ar: 'زيارة مسجد قباء وجبل أحد' } },
      ],
    },
    {
      label: day(13),
      title: { en: 'Fly home', ar: 'العودة إلى الوطن' },
      items: [{ text: { en: 'Transfer to Madinah airport and your flight to London', ar: 'تنقل إلى مطار المدينة المنورة ورحلتك إلى لندن' } }],
    },
  ],
}

// ---- Past trips -------------------------------------------------------------

const istanbul = getPackage('istanbul-city')
const istanbulLines: PriceLine[] = [
  { label: both((lang) => translate(lang, 'booking.line.package', { n: 2 })), amount: istanbul.price * 2 },
]
const dubai = getPackage('dubai-city')
const dubaiLines: PriceLine[] = [
  { label: both((lang) => translate(lang, 'booking.line.package', { n: 1 })), amount: dubai.price },
]

const pastBookings: Booking[] = [
  {
    id: 'bk-istanbul',
    ref: 'CW-41377',
    status: 'confirmed',
    createdAt: minutesAgo(60 * 24 * 140).getTime(),
    kind: 'package',
    title: istanbul.title,
    subtitle: { en: 'Istanbul · Old City hotel', ar: 'إسطنبول · فندق في المدينة القديمة' },
    image: PHOTOS.istanbulMosque,
    destinationId: 'istanbul',
    packageId: istanbul.id,
    startDate: fromToday(-96),
    endDate: fromToday(-92),
    adults: 2,
    children: 0,
    lines: istanbulLines,
    total: sumLines(istanbulLines),
    itinerary: generateItinerary('istanbul', istanbul.nights),
  },
  {
    id: 'bk-dubai',
    ref: 'CW-36052',
    status: 'confirmed',
    createdAt: minutesAgo(60 * 24 * 300).getTime(),
    kind: 'package',
    title: dubai.title,
    subtitle: { en: 'Dubai · City hotel', ar: 'دبي · فندق في المدينة' },
    image: PHOTOS.dubaiMarina,
    destinationId: 'dubai',
    packageId: dubai.id,
    startDate: fromToday(-262),
    endDate: fromToday(-257),
    adults: 1,
    children: 0,
    lines: dubaiLines,
    total: sumLines(dubaiLines),
    rating: 5,
    itinerary: generateItinerary('dubai', dubai.nights),
  },
]

export const SEED_BOOKINGS: Booking[] = [cairoBooking, umrahBooking, ...pastBookings]

export const SEED_APPLICATIONS: Application[] = [
  {
    id: 'ap-egypt',
    ref: 'EA-20931',
    service: 'egypt',
    countryId: 'egypt',
    applicant: USER.name,
    status: 'review',
    fee: 84,
    submittedAt: minutesAgo(60 * 24 * 3 + 220).getTime(),
    updatedAt: minutesAgo(125).getTime(),
    travelDate: cairoStart,
  },
]

export const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n-approval',
    icon: 'approval',
    title: { en: 'Approval under review', ar: 'طلبك قيد المراجعة' },
    body: {
      en: 'Your documents are verified. We’ll update you as soon as your Egypt security approval is issued.',
      ar: 'تم التحقق من مستنداتك، وسنُعلمك فور صدور موافقتك الأمنية لمصر.',
    },
    at: minutesAgo(125).getTime(),
    target: 'application',
  },
  {
    id: 'n-price',
    icon: 'price',
    title: { en: 'Price drop to Istanbul', ar: 'انخفاض أسعار إسطنبول' },
    body: { en: 'London to Istanbul is now from £119 return.', ar: 'رحلات لندن إلى إسطنبول الآن ابتداءً من £119 ذهابًا وعودة.' },
    at: minutesAgo(300).getTime(),
    target: 'istanbul',
  },
  {
    id: 'n-checkin',
    icon: 'checkin',
    title: { en: 'Your Cairo trip is coming up', ar: 'رحلتك إلى القاهرة تقترب' },
    body: {
      en: 'Online check-in for MS 778 opens 24 hours before departure.',
      ar: 'يفتح تسجيل الوصول عبر الإنترنت لرحلة MS 778 قبل 24 ساعة من المغادرة.',
    },
    at: minutesAgo(60 * 26).getTime(),
    target: 'trip-cairo',
  },
  {
    id: 'n-deposit',
    icon: 'payment',
    title: { en: 'Deposit received', ar: 'تم استلام العربون' },
    body: { en: 'Your Ramadan Umrah deposit is confirmed.', ar: 'تم تأكيد عربون عمرة رمضان.' },
    at: minutesAgo(60 * 24 * 3).getTime(),
    target: 'trip-umrah',
  },
  {
    id: 'n-welcome',
    icon: 'welcome',
    title: { en: 'Welcome to Cross World', ar: 'مرحبًا بك في كروس وورلد' },
    body: {
      en: 'Your journey, our priority. Explore this season’s special offers.',
      ar: 'رحلتك أولويتنا. استكشف عروض هذا الموسم المميزة.',
    },
    at: minutesAgo(60 * 24 * 9).getTime(),
    target: 'offers',
  },
]

export const SEED_CHAT: ChatMessage[] = [
  { id: 'c1', from: 'agent', at: minutesAgo(126).getTime(), key: 'chat.seed.welcome' },
  { id: 'c2', from: 'user', at: minutesAgo(124).getTime(), key: 'chat.seed.question', read: true },
  { id: 'c3', from: 'agent', at: minutesAgo(121).getTime(), key: 'chat.seed.answer', card: 'approval' },
]

export const SEED_CARDS: PaymentCard[] = [
  { id: 'visa-4821', brand: 'Visa', last4: '4821', expiry: '09/29' },
  { id: 'mc-9034', brand: 'Mastercard', last4: '9034', expiry: '03/28' },
]

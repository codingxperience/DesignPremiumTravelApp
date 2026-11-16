import { PHOTOS } from '@/lib/images'
import type { Localized } from '@/lib/i18n'
import type { Hotel } from './types'

export const HOTEL_CITIES: { id: string; name: Localized; destinationId: string }[] = [
  { id: 'cairo', name: { en: 'Cairo', ar: 'القاهرة' }, destinationId: 'cairo' },
  { id: 'makkah', name: { en: 'Makkah', ar: 'مكة المكرمة' }, destinationId: 'makkah' },
  { id: 'dubai', name: { en: 'Dubai', ar: 'دبي' }, destinationId: 'dubai' },
  { id: 'istanbul', name: { en: 'Istanbul', ar: 'إسطنبول' }, destinationId: 'istanbul' },
]

export const HOTEL_OPTIONS = [
  { id: 'deluxe', key: 'hotels.option.deluxe', delta: 0 },
  { id: 'executive', key: 'hotels.option.executive', delta: 45 },
  { id: 'suite', key: 'hotels.option.suite', delta: 120 },
] as const

export const HOTELS: Hotel[] = [
  {
    id: 'giza-view',
    cityId: 'cairo',
    name: { en: 'Giza Pyramids View Hotel', ar: 'فندق إطلالة أهرامات الجيزة' },
    area: { en: 'Giza · pyramid views from the terrace', ar: 'الجيزة · إطلالة على الأهرامات من التراس' },
    stars: 5,
    rating: 4.8,
    reviews: 1240,
    image: PHOTOS.hotelWave,
    pricePerNight: 96,
    amenities: ['view', 'pool', 'breakfast', 'wifi'],
  },
  {
    id: 'nile-grand',
    cityId: 'cairo',
    name: { en: 'Nile Corniche Grand', ar: 'جراند كورنيش النيل' },
    area: { en: 'Garden City · on the Nile', ar: 'جاردن سيتي · على النيل' },
    stars: 5,
    rating: 4.7,
    reviews: 980,
    image: PHOTOS.hotelMoody,
    pricePerNight: 128,
    amenities: ['spa', 'pool', 'view', 'gym'],
  },
  {
    id: 'zamalek',
    cityId: 'cairo',
    name: { en: 'Zamalek Boutique Residence', ar: 'زمالك بوتيك ريزيدنس' },
    area: { en: 'Zamalek · leafy island district', ar: 'الزمالك · حي الجزيرة الهادئ' },
    stars: 4,
    rating: 4.6,
    reviews: 610,
    image: PHOTOS.hotelClassic,
    pricePerNight: 74,
    amenities: ['breakfast', 'wifi', 'gym'],
  },
  {
    id: 'haram-tower',
    cityId: 'makkah',
    name: { en: 'Haram View Tower', ar: 'برج إطلالة الحرم' },
    area: { en: 'Ajyad · facing the Haram', ar: 'أجياد · مقابل الحرم' },
    stars: 5,
    rating: 4.9,
    reviews: 2310,
    image: PHOTOS.clockTower,
    pricePerNight: 210,
    amenities: ['view', 'breakfast', 'wifi'],
    haramDistance: 150,
  },
  {
    id: 'ajyad-plaza',
    cityId: 'makkah',
    name: { en: 'Ajyad Plaza Hotel', ar: 'فندق أجياد بلازا' },
    area: { en: 'Ajyad · quiet side street', ar: 'أجياد · شارع جانبي هادئ' },
    stars: 4,
    rating: 4.6,
    reviews: 1180,
    image: PHOTOS.hotelBright,
    pricePerNight: 118,
    amenities: ['breakfast', 'wifi'],
    haramDistance: 550,
  },
  {
    id: 'marina-suites',
    cityId: 'dubai',
    name: { en: 'Marina Skyline Suites', ar: 'أجنحة مارينا سكاي لاين' },
    area: { en: 'Dubai Marina · waterfront', ar: 'مرسى دبي · على الواجهة المائية' },
    stars: 5,
    rating: 4.8,
    reviews: 1640,
    image: PHOTOS.dubaiMarina,
    pricePerNight: 165,
    amenities: ['pool', 'view', 'gym', 'spa'],
  },
  {
    id: 'downtown-boulevard',
    cityId: 'dubai',
    name: { en: 'Downtown Boulevard Hotel', ar: 'فندق داون تاون بوليفارد' },
    area: { en: 'Downtown · by the Dubai Mall', ar: 'وسط المدينة · بجوار دبي مول' },
    stars: 4,
    rating: 4.7,
    reviews: 1320,
    image: PHOTOS.resortPool,
    pricePerNight: 119,
    amenities: ['pool', 'breakfast', 'wifi'],
  },
  {
    id: 'sultanahmet-garden',
    cityId: 'istanbul',
    name: { en: 'Sultanahmet Garden Hotel', ar: 'فندق حديقة السلطان أحمد' },
    area: { en: 'Sultanahmet · old city', ar: 'السلطان أحمد · المدينة القديمة' },
    stars: 4,
    rating: 4.7,
    reviews: 890,
    image: PHOTOS.istanbulAerial,
    pricePerNight: 82,
    amenities: ['breakfast', 'wifi', 'view'],
  },
  {
    id: 'bosphorus-palace',
    cityId: 'istanbul',
    name: { en: 'Bosphorus Palace Residence', ar: 'قصر البوسفور ريزيدنس' },
    area: { en: 'Beşiktaş · on the water', ar: 'بشكتاش · على الماء' },
    stars: 5,
    rating: 4.8,
    reviews: 760,
    image: PHOTOS.istanbulMosque,
    pricePerNight: 154,
    amenities: ['view', 'spa', 'breakfast'],
  },
]

export function getHotel(id: string): Hotel {
  const hotel = HOTELS.find((h) => h.id === id)
  if (!hotel) throw new Error(`Unknown hotel: ${id}`)
  return hotel
}

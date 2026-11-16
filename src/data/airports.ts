import type { Airport } from './types'

export const AIRPORTS: Airport[] = [
  { code: 'LHR', city: { en: 'London', ar: 'لندن' }, name: { en: 'Heathrow', ar: 'مطار هيثرو' }, tz: 0, uk: true },
  { code: 'LGW', city: { en: 'London', ar: 'لندن' }, name: { en: 'Gatwick', ar: 'مطار غاتويك' }, tz: 0, uk: true },
  { code: 'MAN', city: { en: 'Manchester', ar: 'مانشستر' }, name: { en: 'Manchester Airport', ar: 'مطار مانشستر' }, tz: 0, uk: true },
  { code: 'CAI', city: { en: 'Cairo', ar: 'القاهرة' }, name: { en: 'Cairo International', ar: 'مطار القاهرة الدولي' }, tz: 2 },
  { code: 'JED', city: { en: 'Jeddah', ar: 'جدة' }, name: { en: 'King Abdulaziz International', ar: 'مطار الملك عبدالعزيز الدولي' }, tz: 3 },
  { code: 'MED', city: { en: 'Madinah', ar: 'المدينة المنورة' }, name: { en: 'Prince Mohammad bin Abdulaziz', ar: 'مطار الأمير محمد بن عبدالعزيز' }, tz: 3 },
  { code: 'DXB', city: { en: 'Dubai', ar: 'دبي' }, name: { en: 'Dubai International', ar: 'مطار دبي الدولي' }, tz: 4 },
  { code: 'IST', city: { en: 'Istanbul', ar: 'إسطنبول' }, name: { en: 'Istanbul Airport', ar: 'مطار إسطنبول' }, tz: 3 },
  { code: 'ZNZ', city: { en: 'Zanzibar', ar: 'زنجبار' }, name: { en: 'Abeid Amani Karume International', ar: 'مطار عبيد أماني كرومي الدولي' }, tz: 3 },
  { code: 'RAK', city: { en: 'Marrakech', ar: 'مراكش' }, name: { en: 'Marrakech Menara', ar: 'مطار مراكش المنارة' }, tz: 1 },
  { code: 'CPT', city: { en: 'Cape Town', ar: 'كيب تاون' }, name: { en: 'Cape Town International', ar: 'مطار كيب تاون الدولي' }, tz: 2 },
  { code: 'SSH', city: { en: 'Sharm El Sheikh', ar: 'شرم الشيخ' }, name: { en: 'Sharm El Sheikh International', ar: 'مطار شرم الشيخ الدولي' }, tz: 2 },
  { code: 'LXR', city: { en: 'Luxor', ar: 'الأقصر' }, name: { en: 'Luxor International', ar: 'مطار الأقصر الدولي' }, tz: 2 },
  { code: 'MLE', city: { en: 'Malé', ar: 'ماليه' }, name: { en: 'Velana International', ar: 'مطار فيلانا الدولي' }, tz: 5 },
  { code: 'PZU', city: { en: 'Port Sudan', ar: 'بورتسودان' }, name: { en: 'Port Sudan New International', ar: 'مطار بورتسودان الدولي الجديد' }, tz: 2 },
]

export function getAirport(code: string): Airport {
  const airport = AIRPORTS.find((a) => a.code === code)
  if (!airport) throw new Error(`Unknown airport: ${code}`)
  return airport
}

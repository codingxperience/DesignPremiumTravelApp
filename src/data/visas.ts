import type { VisaCountry } from './types'

export const NATIONALITIES = [
  { id: 'sd', name: { en: 'Sudanese', ar: 'سوداني' } },
  { id: 'gb', name: { en: 'British', ar: 'بريطاني' } },
  { id: 'eg', name: { en: 'Egyptian', ar: 'مصري' } },
  { id: 'other', name: { en: 'Other nationality', ar: 'جنسية أخرى' } },
] as const

export const VISA_COUNTRIES: VisaCountry[] = [
  {
    id: 'schengen',
    flag: 'eu',
    name: { en: 'Schengen Area', ar: 'منطقة شنغن' },
    type: { en: 'Short-stay visa (type C)', ar: 'تأشيرة إقامة قصيرة (فئة C)' },
    processingDays: 15,
    fee: 89,
  },
  {
    id: 'saudi',
    flag: 'sa',
    name: { en: 'Saudi Arabia', ar: 'المملكة العربية السعودية' },
    type: { en: 'Tourist & Umrah e-Visa', ar: 'تأشيرة سياحة وعمرة إلكترونية' },
    processingDays: 2,
    fee: 49,
    destinationId: 'makkah',
  },
  {
    id: 'uae',
    flag: 'ae',
    name: { en: 'United Arab Emirates', ar: 'الإمارات العربية المتحدة' },
    type: { en: 'Tourist visa', ar: 'تأشيرة سياحية' },
    processingDays: 3,
    fee: 69,
    destinationId: 'dubai',
  },
  {
    id: 'turkiye',
    flag: 'tr',
    name: { en: 'Türkiye', ar: 'تركيا' },
    type: { en: 'e-Visa', ar: 'تأشيرة إلكترونية' },
    processingDays: 1,
    fee: 39,
    destinationId: 'istanbul',
  },
  {
    id: 'morocco',
    flag: 'ma',
    name: { en: 'Morocco', ar: 'المغرب' },
    type: { en: 'Tourist visa', ar: 'تأشيرة سياحية' },
    processingDays: 10,
    fee: 59,
    destinationId: 'marrakech',
  },
  {
    id: 'usa',
    flag: 'us',
    name: { en: 'United States', ar: 'الولايات المتحدة' },
    type: { en: 'Visitor visa (B1/B2)', ar: 'تأشيرة زيارة (B1/B2)' },
    processingDays: 30,
    fee: 129,
  },
  {
    id: 'egypt-visa',
    flag: 'eg',
    name: { en: 'Egypt', ar: 'مصر' },
    type: { en: 'Tourist e-Visa', ar: 'تأشيرة سياحية إلكترونية' },
    processingDays: 3,
    fee: 35,
    destinationId: 'cairo',
  },
]

/** The Egypt security approval is a dedicated service rather than a visa. */
export const EGYPT_APPROVAL = {
  id: 'egypt',
  flag: 'eg' as const,
  name: { en: 'Egypt', ar: 'مصر' },
  fullFee: 120,
  fee: 84,
}

export function getVisaCountry(id: string): VisaCountry | undefined {
  return VISA_COUNTRIES.find((c) => c.id === id)
}

import {useApprovalCountries} from './approvalCountries'
import {EgyptScreen} from './Egypt'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowRight, CalendarDays, Check, FileText, IdCard, ImageIcon, LockKeyhole, CloudUpload, UserRound } from 'lucide-react'
import { CAIRO_QUERY, USER } from '@/data/demo'
import type { Application } from '@/data/types'
import { EGYPT_APPROVAL, getVisaCountry, NATIONALITIES } from '@/data/visas'
import { cn } from '@/lib/cn'
import { fromToday } from '@/lib/dates'
import type { TKey } from '@/lib/i18n'
import { useAppState, useDispatch, useI18n, useNav } from '@/state/store'
import { Button } from '@/ui/Button'
import { Chip } from '@/ui/Controls'
import { PickerField, TextField } from '@/ui/Field'
import { Flag } from '@/ui/Flag'
import { Heading } from '@/ui/Heading'
import { Card } from '@/ui/Misc'
import { EASE_OUT, FLIP_RTL } from '@/ui/motion'
import { Screen, ScreenHeader, StickyFooter } from '@/ui/Screen'
import { DatesSheet } from '../flights/parts'
import { applicationInfo, StatusTimeline } from './status'

type DocKey = 'passport' | 'photo' | 'residence' | 'ticket'
type Upload = { progress: number; done: boolean }

const DOCS: { key: DocKey; label: TKey; icon: typeof FileText; file: string; optional?: boolean }[] = [
  { key: 'passport', label: 'app.upload.passport', icon: IdCard, file: 'passport_ahmed_mohamed.pdf · 1.2 MB' },
  { key: 'photo', label: 'app.upload.photo', icon: ImageIcon, file: 'photo_white_background.jpg · 640 KB' },
  { key: 'residence', label: 'app.upload.residence', icon: FileText, file: 'uk_residence_permit.pdf · 860 KB', optional: true },
]

const PURPOSES: TKey[] = ['purpose.tourism', 'purpose.family', 'purpose.business']

function reference(prefix: string) {
  return `${prefix}-${Math.floor(10_000 + Math.random() * 90_000)}`
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3 text-[13.5px]">
      <span className="text-fg-muted">{label}</span>
      <span className="text-end font-medium">{value}</span>
    </div>
  )
}

function ApplicationForm({ service, countryId }: { service: 'egypt' | 'visa'; countryId: string }) {
  const { t, tp, L, money, date } = useI18n()
  const { pop, reset } = useNav()
  const { cards, defaultCardId } = useAppState()
  const dispatch = useDispatch()
  const isEgypt = service === 'egypt'
  const docs = isEgypt ? [...DOCS.filter(doc=>doc.key!=='residence'),{key:'ticket' as const,label:'egypt.doc3' as const,icon:FileText,file:'flight-ticket.jpg',optional:false}] : DOCS
  const visaCountry = getVisaCountry(countryId)
  const country = isEgypt ? EGYPT_APPROVAL : visaCountry
  const fullFee = isEgypt ? EGYPT_APPROVAL.fullFee : (visaCountry?.fee ?? 0)
  const fee = isEgypt ? EGYPT_APPROVAL.fee : fullFee

  const [step, setStep] = useState(0)
  const [fullName, setFullName] = useState(USER.name)
  const [nationality, setNationality] = useState<string>(isEgypt ? countryId.toLowerCase() : 'gb')
  const [passport, setPassport] = useState('P04521873')
  const [dob, setDob] = useState('12/04/1990')
  const [travelDate, setTravelDate] = useState(isEgypt ? CAIRO_QUERY.depart : fromToday(30))
  const [purpose, setPurpose] = useState<TKey>('purpose.tourism')
  const [uploads, setUploads] = useState<Partial<Record<DocKey, Upload>>>({})
  const [datesOpen, setDatesOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState<Application | null>(null)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach((timer) => window.clearInterval(timer)), [])

  const card = cards.find((c) => c.id === defaultCardId) ?? cards[0]
  const serviceTitle = isEgypt ? t('egypt.title') : `${L(country?.name ?? { en: '', ar: '' })} · ${L(visaCountry?.type ?? { en: '', ar: '' })}`
  const uploadedCount = docs.filter((doc) => uploads[doc.key]?.done).length
  const detailsValid = fullName.trim().length > 1 && passport.trim().length >= 6 && /^\d{2}\/\d{2}\/\d{4}$/.test(dob)
  const docsValid = !!uploads.passport?.done && !!uploads.photo?.done && (!isEgypt || !!uploads.ticket?.done)

  const upload = (key: DocKey) => {
    let progress = 0
    setUploads((current) => ({ ...current, [key]: { progress: 0, done: false } }))
    const timer = window.setInterval(() => {
      progress = Math.min(100, progress + 14 + Math.random() * 20)
      setUploads((current) => ({ ...current, [key]: { progress: Math.round(progress), done: progress >= 100 } }))
      if (progress >= 100) window.clearInterval(timer)
    }, 170)
    timers.current.push(timer)
  }

  const submit = () => {
    setSubmitting(true)
    const timer = window.setTimeout(() => {
      const application: Application = {
        id: `ap-${Date.now()}`,
        ref: reference(isEgypt ? 'EA' : 'VA'),
        service,
        countryId,
        applicant: fullName,
        status: 'submitted',
        fee,
        submittedAt: Date.now(),
        updatedAt: Date.now(),
        travelDate,
        isNew: true,
      }
      dispatch({ type: 'ADD_APPLICATION', application })
      setCreated(application)
      setSubmitting(false)
      setStep(3)
    }, 1700)
    timers.current.push(timer)
  }

  const next = () => {
    if (step === 0 && detailsValid) setStep(1)
    else if (step === 1 && docsValid) setStep(2)
    else if (step === 2) submit()
  }

  const stepTitles: TKey[] = ['app.details', 'app.documents', 'app.review']
  const canContinue = step === 0 ? detailsValid : step === 1 ? docsValid : true

  const footer =
    step < 3 ? (
      <StickyFooter>
        {step === 1 && !docsValid && <p className="mb-2.5 text-center text-[12.5px] text-fg-subtle">{isEgypt ? L({en:'Attach your passport, personal photo and flight ticket to continue.',ar:'أرفق جواز السفر وصورتك وتذكرة الطيران للمتابعة.'}) : t('app.upload.needed')}</p>}
        <Button
          block
          onClick={next}
          disabled={!canContinue}
          loading={submitting}
          icon={step === 2 ? <LockKeyhole className="size-[18px]" /> : undefined}
          iconEnd={step < 2 ? <ArrowRight className={cn('size-5', FLIP_RTL)} /> : undefined}
        >
          {step === 2 ? t('app.submit', { amount: money(fee) }) : t('common.continue')}
        </Button>
      </StickyFooter>
    ) : (
      <StickyFooter className="space-y-2">
        <Button block onClick={() => created && reset('trips', [{ name: 'applicationStatus', id: created.id }])}>
          {t('app.track')}
        </Button>
        <Button block variant="ghost" size="md" onClick={() => reset('explore')}>
          {t('app.backHome')}
        </Button>
      </StickyFooter>
    )

  return (
    <Screen
      label={serviceTitle}
      header={
        <ScreenHeader
          title={isEgypt ? t('egypt.title') : L(country?.name ?? { en: '', ar: '' })}
          subtitle={step < 3 ? t('app.step', { n: step + 1, total: 3 }) : undefined}
          hideBack={step === 3}
          onBack={step > 0 && step < 3 ? () => setStep(step - 1) : pop}
        />
      }
      footer={footer}
      className="px-5 pb-8 pt-2"
    >
      {step < 3 && (
        <>
          <div className="flex gap-1.5" aria-hidden>
            {[0, 1, 2].map((index) => (
              <span key={index} className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                <motion.span className="block h-full origin-left rounded-full bg-brand-orange rtl:origin-right" initial={false} animate={{ scaleX: index <= step ? 1 : 0 }} transition={{ duration: 0.45, ease: EASE_OUT }} />
              </span>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-3">
            {country && <Flag code={country.flag} className="size-9" />}
            <Heading as="h2" size="lg">
              {t(stepTitles[step])}
            </Heading>
          </div>
        </>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease: EASE_OUT }}>
          {step === 0 && (
            <div className="mt-6 space-y-4">
              <TextField label={t('app.fullName')} icon={<UserRound />} value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" />
              <div>
                <p className="mb-2 text-[13px] font-medium text-fg-muted">{t('app.nationality')}</p>
                <div className="flex flex-wrap gap-2">
                  {(isEgypt ? [{id:nationality,name:{en:new Intl.DisplayNames(['en'],{type:'region'}).of(nationality.toUpperCase())!,ar:new Intl.DisplayNames(['ar'],{type:'region'}).of(nationality.toUpperCase())!},flag:nationality}] : NATIONALITIES).map((option) => (
                    <Chip key={option.id} selected={nationality === option.id} onClick={() => setNationality(option.id)}>
                      {L(option.name)}
                    </Chip>
                  ))}
                </div>
              </div>
              <TextField label={t('app.passportNo')} icon={<IdCard />} value={passport} onChange={(event) => setPassport(event.target.value.toUpperCase())} ltr />
              <TextField label={t('app.dob')} value={dob} onChange={(event) => setDob(event.target.value)} placeholder="DD/MM/YYYY" inputMode="numeric" ltr />
              <PickerField
                className="w-full"
                label={t('app.travelDate')}
                icon={<CalendarDays />}
                value={date(travelDate, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                onClick={() => setDatesOpen(true)}
              />
              <div>
                <p className="mb-2 text-[13px] font-medium text-fg-muted">{t('app.purpose')}</p>
                <div className="flex flex-wrap gap-2">
                  {PURPOSES.map((option) => (
                    <Chip key={option} selected={purpose === option} onClick={() => setPurpose(option)}>
                      {t(option)}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="mt-6 space-y-3">
              {docs.map((doc) => {
                const state = uploads[doc.key]
                const Icon = doc.icon
                if (doc.key === 'ticket') return <label key={doc.key} className="block rounded-[22px] border border-white/15 p-4">
                  <span className="mb-2 block font-semibold">{t(doc.label)}</span>
                  <input type="file" accept="image/png,image/jpeg" onChange={event=>{
                    const file=event.currentTarget.files?.[0]
                    const valid=!!file && file.size>0 && file.size<=2*1024*1024 && ['image/jpeg','image/png'].includes(file.type)
                    event.currentTarget.setCustomValidity(valid?'':L({en:'Choose a JPEG or PNG under 2 MB.',ar:'اختر صورة JPEG أو PNG أصغر من ٢ ميغابايت.'}))
                    if(file && !valid)event.currentTarget.reportValidity()
                    setUploads(current=>({...current,ticket:{done:valid,progress:valid?100:0}}))
                  }} />
                </label>
                return (
                  <button
                    key={doc.key}
                    type="button"
                    onClick={() => upload(doc.key)}
                    disabled={!!state && !state.done}
                    className={cn(
                      'flex w-full items-center gap-3.5 rounded-[22px] border p-4 text-start transition-colors',
                      state?.done ? 'border-success/35 bg-success/[0.06]' : 'border-dashed border-white/15 bg-white/[0.03] hover:bg-white/[0.05]',
                    )}
                  >
                    <span className={cn('grid size-11 shrink-0 place-items-center rounded-[14px]', state?.done ? 'bg-success/15 text-success' : 'bg-white/[0.06] text-fg-muted')}>
                      {state?.done ? <Check className="size-5" strokeWidth={2.5} /> : <Icon className="size-5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-[15px] font-semibold">
                        {t(doc.label)}
                        {doc.optional && <span className="text-[11.5px] font-medium text-fg-subtle">· {t('common.optional')}</span>}
                      </span>
                      {state && !state.done ? (
                        <span className="mt-2 block">
                          <span className="block h-1.5 overflow-hidden rounded-full bg-white/10">
                            <motion.span className="block h-full rounded-full bg-brand-orange" animate={{ width: `${state.progress}%` }} transition={{ duration: 0.18 }} />
                          </span>
                          <span className="mt-1.5 block text-[12px] text-fg-muted">{t('app.upload.uploading', { p: state.progress })}</span>
                        </span>
                      ) : (
                        <span className="mt-0.5 block truncate text-[12.5px] text-fg-muted" dir={state?.done ? 'ltr' : undefined}>
                          {state?.done ? doc.file : t('app.upload.tap')}
                        </span>
                      )}
                    </span>
                    {state?.done ? (
                      <span className="text-[12.5px] font-semibold text-orange-300">{t('app.upload.replace')}</span>
                    ) : (
                      !state && <CloudUpload className="size-5 text-fg-subtle" />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {step === 2 && (
            <div className="mt-6 space-y-4">
              <Card className="divide-y divide-white/[0.06]">
                <Row label={t('app.service')} value={isEgypt ? t('egypt.title') : L(visaCountry?.type ?? { en: '', ar: '' })} />
                <Row label={t('app.destination')} value={L(country?.name ?? { en: '', ar: '' })} />
                <Row label={t('app.applicant')} value={fullName} />
                <Row label={t('app.nationality')} value={new Intl.DisplayNames([document.documentElement.lang || 'en'],{type:'region'}).of(nationality.toUpperCase())} />
                <Row label={t('app.passportNo')} value={<span dir="ltr">{passport}</span>} />
                <Row label={t('app.travelDate')} value={date(travelDate, { day: 'numeric', month: 'long', year: 'numeric' })} />
                <Row label={t('app.purpose')} value={t(purpose)} />
                <Row label={t('app.documents')} value={tp('app.documentsCount', uploadedCount)} />
              </Card>
              <Card className="p-4">
                <div className="flex justify-between text-[13.5px]">
                  <span className="text-fg-muted">{t('app.fee')}</span>
                  <span className="font-medium tabular-nums">{money(fullFee)}</span>
                </div>
                {isEgypt && (
                  <div className="mt-2.5 flex justify-between text-[13.5px]">
                    <span className="text-fg-muted">{t('app.discount')}</span>
                    <span className="font-medium tabular-nums text-success">−{money(fullFee - fee)}</span>
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-4">
                  <span className="text-[15px] font-semibold">{t('common.total')}</span>
                  <span className="text-[20px] font-semibold tabular-nums">{money(fee)}</span>
                </div>
                <p className="mt-3 text-[12px] leading-relaxed text-fg-subtle">{t('app.govFees')}</p>
              </Card>
              {card && (
                <p className="flex items-center justify-center gap-2 text-[12.5px] text-fg-muted">
                  <LockKeyhole className="size-3.5" />
                  {t('pay.card', { brand: card.brand, last4: card.last4 })}
                </p>
              )}
            </div>
          )}

          {step === 3 && created && (
            <div className="pt-6 text-center">
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="mx-auto grid size-20 place-items-center rounded-full bg-success/15 text-success ring-8 ring-success/[0.06]"
              >
                <Check className="size-9" strokeWidth={2.75} />
              </motion.span>
              <Heading as="h2" size="xl" className="mt-6">
                {t('app.submitted')}
              </Heading>
              <p className="mx-auto mt-3 max-w-[300px] text-[14.5px] leading-relaxed text-fg-muted">{t('app.submittedBody')}</p>
              <Card className="mt-7 p-4 text-start">
                <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                  <div className="flex items-center gap-3">
                    <Flag code={applicationInfo(created).flag} className="size-9" />
                    <div>
                      <p className="text-[14.5px] font-semibold">{L(applicationInfo(created).title)}</p>
                      <p className="text-[12px] text-fg-subtle">{t('app.ref')}</p>
                    </div>
                  </div>
                  <span className="text-[15px] font-semibold tracking-[0.06em]" dir="ltr">
                    {created.ref}
                  </span>
                </div>
                <StatusTimeline application={created} />
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <DatesSheet open={datesOpen} onClose={() => setDatesOpen(false)} mode="single" start={travelDate} onApply={(value) => setTravelDate(value)} />
    </Screen>
  )
}

function EgyptApplication({code}:{code:string}){
  const {countries}=useApprovalCountries()
  return countries?.includes(code) ? <ApplicationForm service="egypt" countryId={code}/> : <EgyptScreen/>
}
export function ApplicationScreen(props:{service:'egypt'|'visa';countryId:string}){
  return props.service==='egypt'?<EgyptApplication code={props.countryId}/>:<ApplicationForm {...props}/>
}

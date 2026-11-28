import {useState} from 'react'
import {useApprovalCountries} from './approvalCountries'
import { ArrowRight, Check, ChevronLeft, CircleQuestionMark, Plane, ShieldCheck, Tag } from 'lucide-react'
import { EGYPT_APPROVAL } from '@/data/visas'
import { cn } from '@/lib/cn'
import type { TKey } from '@/lib/i18n'
import { PHOTOS } from '@/lib/images'
import { useI18n, useLiveApp, useNav } from '@/state/store'
import { Button, IconButton } from '@/ui/Button'
import { Flag } from '@/ui/Flag'
import { Heading } from '@/ui/Heading'
import { Img } from '@/ui/Img'
import { Badge, Card } from '@/ui/Misc'
import { FLIP_RTL } from '@/ui/motion'
import { Screen, StickyFooter } from '@/ui/Screen'

const BENEFITS: { icon: typeof Plane; label: TKey }[] = [
  { icon: ShieldCheck, label: 'egypt.b1' },
  { icon: Plane, label: 'egypt.b2' },
  { icon: Tag, label: 'egypt.b3' },
]

const DOCUMENTS: TKey[] = ['egypt.doc1', 'egypt.doc2', 'egypt.doc3']

export function EgyptScreen() {
  const live = useLiveApp()
  const { t, money, isRtl, L, lang } = useI18n()
  const {countries,failed,retry}=useApprovalCountries()
  const [nationality,setNationality]=useState('')
  const eligible=!!countries?.includes(nationality)
  const { pop, push } = useNav()

  return (
    <Screen
      label={t('egypt.title')}
      footer={
        <StickyFooter className="flex items-center justify-between gap-4">
          {live ? <span className="text-sm text-fg-muted">{isRtl ? 'مكتب السفر' : 'Travel desk'}</span> : <div>
            <p className="text-[12px] text-fg-subtle">{t('egypt.fee')}</p>
            <p className="flex items-baseline gap-2">
              <span className="text-[22px] font-semibold tabular-nums">{money(EGYPT_APPROVAL.fee)}</span>
              <span className="text-[13px] text-fg-subtle line-through tabular-nums">{money(EGYPT_APPROVAL.fullFee)}</span>
            </p>
          </div>}
          <Button disabled={!eligible} onClick={() => push({ name: 'application', service: 'egypt', countryId: nationality })} className="min-w-[170px]" iconEnd={<ArrowRight className={cn('size-5', FLIP_RTL)} />}>
            {t('egypt.start')}
          </Button>
        </StickyFooter>
      }
      className="pb-8"
    >
      <div className="relative h-[420px] overflow-hidden">
        <Img id={PHOTOS.sphinxKhafre} alt={t('egypt.title')} width={390} height={420} priority className="absolute inset-0 size-full" />
        <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,11,23,0.55)_0%,rgba(5,11,23,0.05)_38%,#081226_100%)]" />
        <div className="absolute start-4 top-[calc(var(--sat)+8px)]">
          <IconButton label={t('common.back')} variant="onImage" onClick={pop}>
            <ChevronLeft className={FLIP_RTL} />
          </IconButton>
        </div>
        <div className="absolute inset-x-5 bottom-6">
          <Badge tone="solid">{live ? t('service.egypt') : t('egypt.kicker')}</Badge>
          <div className="mt-4 flex items-center gap-3">
            <Flag code="eg" className="size-8" />
            <Heading as="h1" size="xl" className="text-white">
              {t('egypt.title')}
            </Heading>
          </div>
          {!isRtl && (
            <p className="mt-1.5 text-[17px] font-bold text-orange-300" lang="ar" dir="rtl">
              الموافقة الأمنية لمصر
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4 px-5 pb-5">
        <p>{L({en:'A flight ticket is required before the agency can apply for Egypt security approval. Have a clear photo or screenshot of the ticket ready.',ar:'يشترط المكتب تذكرة طيران قبل تقديم طلب الموافقة الأمنية لمصر. جهّز صورة واضحة للتذكرة.'})}</p>
        {failed ? <p role="status">{L({en:'Eligibility is unavailable. Contact the travel desk or try again.',ar:'تعذر تحميل قائمة الأهلية. تواصل مع المكتب أو حاول مجدداً.'})} <button onClick={retry} className="text-orange-300">{L({en:'Retry',ar:'إعادة المحاولة'})}</button></p> : countries===null ? <p role="status">{L({en:'Checking passport countries…',ar:'جارٍ تحميل دول جواز السفر…'})}</p> : !countries.length ? <p role="status">{L({en:'Applications will open when the agency publishes the eligible passport countries.',ar:'ستتاح الطلبات عندما ينشر المكتب قائمة دول جواز السفر المؤهلة.'})}</p> :
        <label className="block text-sm">{L({en:'Passport country',ar:'دولة جواز السفر'})}<select className="mt-2 w-full rounded-xl bg-ink-800 p-3" value={nationality} onChange={e=>setNationality(e.target.value)}><option value="">{L({en:'Select your passport country',ar:'اختر دولة جواز السفر'})}</option>{countries.map(code=><option value={code} key={code}>{new Intl.DisplayNames([lang],{type:'region'}).of(code)}</option>)}</select></label>}
      </div>
      {!live && <div className="px-5">
        <p className="text-[19px] font-semibold leading-snug">{t('egypt.lead')}</p>
        <p className="mt-2 text-[14.5px] leading-relaxed text-fg-muted">{t('egypt.body')}</p>

        <ul className="mt-6 grid grid-cols-3 gap-2.5">
          {BENEFITS.map(({ icon: Icon, label }) => (
            <li key={label} className="flex flex-col items-center gap-2.5 rounded-[20px] border border-white/[0.07] bg-white/[0.035] px-2 py-4 text-center">
              <span className="grid size-10 place-items-center rounded-[13px] bg-brand-orange/14 text-orange-300">
                <Icon className="size-5" />
              </span>
              <span className="text-[12.5px] font-semibold leading-tight">{t(label)}</span>
            </li>
          ))}
        </ul>

        <Card className="mt-6 p-4">
          <div className="flex items-center gap-2.5">
            <CircleQuestionMark className="size-5 text-sky" />
            <h2 className="text-[15.5px] font-semibold">{t('egypt.who')}</h2>
          </div>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-fg-muted">{L({en:'Eligibility follows the passport-country list published by the agency.',ar:'تتحدد الأهلية وفق قائمة دول الجوازات التي ينشرها المكتب.'})}</p>
        </Card>

        <h2 className="mb-3 mt-7 text-[16px] font-semibold">{t('egypt.docs')}</h2>
        <Card className="divide-y divide-white/[0.06]">
          {DOCUMENTS.map((doc) => (
            <div key={doc} className="flex items-center gap-3 px-4 py-3.5">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-success/15 text-success">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
              <span className="text-[14px]">{t(doc)}</span>
            </div>
          ))}
        </Card>
      </div>}
    </Screen>
  )
}

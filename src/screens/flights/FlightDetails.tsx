import { useState } from 'react'
import { ArrowRight, Check, Minus, Plane } from 'lucide-react'
import { farePrice, findFlight, passengersTotal, returnFlightFor } from '@/data/flights'
import { makeFlightDraft } from '@/data/quotes'
import type { FareId, FlightQuery } from '@/data/types'
import { cn } from '@/lib/cn'
import type { TKey } from '@/lib/i18n'
import { useI18n, useNav } from '@/state/store'
import { Button } from '@/ui/Button'
import { RadioMark } from '@/ui/Controls'
import { Badge, EmptyState, RollingValue } from '@/ui/Misc'
import { FLIP_RTL } from '@/ui/motion'
import { Screen, ScreenHeader, StickyFooter } from '@/ui/Screen'
import { cabinKey, SegmentTimeline } from './parts'

const FARES: { id: FareId; features: { key: TKey; included: boolean }[] }[] = [
  {
    id: 'light',
    features: [
      { key: 'fare.cabinBag', included: true },
      { key: 'fare.checkedBag', included: false },
      { key: 'fare.seatPaid', included: true },
      { key: 'fare.noChanges', included: false },
    ],
  },
  {
    id: 'classic',
    features: [
      { key: 'fare.cabinBag', included: true },
      { key: 'fare.checkedBag', included: true },
      { key: 'fare.seatFree', included: true },
      { key: 'fare.refundable', included: false },
    ],
  },
  {
    id: 'flex',
    features: [
      { key: 'fare.twoBags', included: true },
      { key: 'fare.seatFree', included: true },
      { key: 'fare.changes', included: true },
      { key: 'fare.refundable', included: true },
    ],
  },
]

export function FlightDetailsScreen({ query, flightId }: { query: FlightQuery; flightId: string }) {
  const { t, tp, money } = useI18n()
  const { push, pop } = useNav()
  const [fare, setFare] = useState<FareId>('classic')
  const outbound = findFlight(query, flightId)

  if (!outbound) {
    return (
      <Screen header={<ScreenHeader title={t('flights.yourFlight')} />}>
        <EmptyState icon={<Plane />} title={t('flights.empty.title')} body={t('flights.empty.body')} action={t('flights.edit')} onAction={pop} />
      </Screen>
    )
  }

  const inbound = returnFlightFor(outbound, query)
  const travellers = query.adults + query.children + query.infants
  const total = passengersTotal(farePrice(outbound, fare), query)

  const next = () => push({ name: 'seats', draft: makeFlightDraft({ outbound, inbound, fare, cabin: query.cabin, query }) })

  return (
    <Screen
      label={t('flights.yourFlight')}
      header={<ScreenHeader title={t('flights.yourFlight')} subtitle={`${outbound.from} – ${outbound.to}`} />}
      footer={
        <StickyFooter className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[12px] text-fg-subtle">
              {t('common.total')} · {tp('common.travellers', travellers)}
            </p>
            <RollingValue value={money(total)} className="text-[22px] font-semibold" />
          </div>
          <Button onClick={next} className="min-w-[150px]" iconEnd={<ArrowRight className={cn('size-5', FLIP_RTL)} />}>
            {t('common.continue')}
          </Button>
        </StickyFooter>
      }
      className="space-y-3 px-5 pt-2"
    >
      <SegmentTimeline flight={outbound} label={t('flights.outbound')} />
      {inbound && <SegmentTimeline flight={inbound} label={t('flights.inbound')} />}

      <h2 className="!mt-8 text-[18px] font-semibold">{t('flights.chooseFare')}</h2>
      <div role="radiogroup" aria-label={t('flights.chooseFare')} className="space-y-3">
        {FARES.map((option) => {
          const selected = option.id === fare
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setFare(option.id)}
              className={cn(
                'block w-full rounded-[22px] border p-4 text-start transition-colors duration-200',
                selected ? 'border-brand-orange/70 bg-brand-orange/[0.07]' : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05]',
              )}
            >
              <div className="flex items-center gap-3">
                <RadioMark checked={selected} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-[15.5px] font-semibold">
                    {t(cabinKey(query.cabin))} · {t(`fare.${option.id}`)}
                    {option.id === 'classic' && <Badge tone="orange">{t('flights.recommended')}</Badge>}
                  </p>
                </div>
                <div className="text-end">
                  <p className="text-[17px] font-semibold tabular-nums">{money(farePrice(outbound, option.id))}</p>
                  <p className="text-[11px] text-fg-subtle">{t('common.perPerson')}</p>
                </div>
              </div>
              <ul className="mt-3.5 grid grid-cols-2 gap-x-3 gap-y-2 ps-[34px]">
                {option.features.map((feature) => (
                  <li key={feature.key} className={cn('flex items-start gap-1.5 text-[12.5px] leading-snug', feature.included ? 'text-fg-muted' : 'text-fg-subtle')}>
                    {feature.included ? <Check className="mt-px size-3.5 shrink-0 text-success" strokeWidth={2.5} /> : <Minus className="mt-px size-3.5 shrink-0" />}
                    {t(feature.key)}
                  </li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>
    </Screen>
  )
}

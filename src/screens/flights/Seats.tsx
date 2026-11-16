import { useMemo, useState } from 'react'
import { ArrowRight, ArrowUp, Sparkles, X } from 'lucide-react'
import { seatMap, seatPrice, seatType } from '@/data/flights'
import { makeFlightDraft } from '@/data/quotes'
import type { BookingDraft } from '@/data/types'
import { cn } from '@/lib/cn'
import type { TKey } from '@/lib/i18n'
import { useI18n, useNav } from '@/state/store'
import { Button } from '@/ui/Button'
import { FLIP_RTL } from '@/ui/motion'
import { Screen, ScreenHeader, StickyFooter } from '@/ui/Screen'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']
const SUGGESTED = '22A'

function Legend() {
  const { t } = useI18n()
  const items: { key: TKey; className: string }[] = [
    { key: 'seat.available', className: 'bg-white/[0.12] border-white/15' },
    { key: 'seat.selected', className: 'bg-brand-orange border-brand-orange' },
    { key: 'seat.taken', className: 'bg-white/[0.03] border-white/[0.06]' },
    { key: 'seat.legroom', className: 'bg-sky/15 border-sky/60' },
  ]
  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-1.5 text-[12px] text-fg-muted">
          <span className={cn('size-3.5 rounded-[5px] border', item.className)} />
          {t(item.key)}
        </li>
      ))}
    </ul>
  )
}

export function SeatsScreen({ draft }: { draft: BookingDraft }) {
  const { t, money } = useI18n()
  const { push } = useNav()
  const selection = draft.flight!
  const rows = useMemo(() => seatMap(selection.outbound.id), [selection.outbound.id])
  const [seat, setSeat] = useState<string | undefined>(selection.seat)

  const typeLabel = (id: string) => t(`seat.${seatType(id.slice(-1))}` as TKey)
  const price = seat ? seatPrice(selection.fare, seat.startsWith('18')) : 0
  const proceed = (chosen?: string) => push({ name: 'payment', draft: makeFlightDraft({ ...selection, seat: chosen }) })

  return (
    <Screen
      label={t('seat.title')}
      header={
        <ScreenHeader
          title={t('seat.title')}
          subtitle={selection.outbound.number}
          actions={
            <button type="button" onClick={() => proceed(undefined)} className="text-[13.5px] font-semibold text-orange-300 hover:text-orange-200">
              {t('seat.skip')}
            </button>
          }
        />
      }
      footer={
        <StickyFooter className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold">{seat ? t('seat.summary', { seat, type: typeLabel(seat) }) : t('seat.none')}</p>
            <p className="text-[12.5px] text-fg-muted">{seat ? (price ? money(price) : t('common.free')) : t('seat.skip')}</p>
          </div>
          <Button onClick={() => proceed(seat)} className="min-w-[150px]" iconEnd={<ArrowRight className={cn('size-5', FLIP_RTL)} />}>
            {t('common.continue')}
          </Button>
        </StickyFooter>
      }
      className="px-5 pt-2"
    >
      <button
        type="button"
        onClick={() => setSeat(SUGGESTED)}
        className="flex w-full items-center gap-3 rounded-[20px] border border-brand-orange/25 bg-brand-orange/[0.08] px-4 py-3 text-start"
      >
        <Sparkles className="size-5 shrink-0 text-orange-300" />
        <span className="text-[13px] leading-snug text-orange-100">{t('seat.tip')}</span>
      </button>

      <div className="mt-5">
        <Legend />
      </div>

      <div dir="ltr" className="relative mx-auto mt-6 w-[300px] rounded-t-[150px] rounded-b-[40px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] px-5 pb-6 pt-16">
        <p className="absolute inset-x-0 top-7 flex items-center justify-center gap-1.5 text-[11.5px] font-medium text-fg-subtle">
          <ArrowUp className="size-3.5" />
          {t('seat.front')}
        </p>
        <div className="grid grid-cols-[repeat(3,34px)_1fr_repeat(3,34px)] gap-x-1.5 pb-2 text-center text-[11.5px] font-semibold text-fg-subtle" aria-hidden>
          {LETTERS.slice(0, 3).map((letter) => (
            <span key={letter}>{letter}</span>
          ))}
          <span />
          {LETTERS.slice(3).map((letter) => (
            <span key={letter}>{letter}</span>
          ))}
        </div>
        <div className="space-y-1.5">
          {rows.map((row) => (
            <div key={row.row} className={cn('grid grid-cols-[repeat(3,34px)_1fr_repeat(3,34px)] items-center gap-x-1.5', row.legroom && 'mb-3')}>
              {row.seats.map((s, index) => {
                const selected = s.id === seat
                const state = s.taken ? t('seat.taken') : selected ? t('seat.selected') : t('seat.available')
                const button = (
                  <button
                    key={s.id}
                    type="button"
                    disabled={s.taken}
                    onClick={() => setSeat(selected ? undefined : s.id)}
                    aria-pressed={selected}
                    aria-label={t('seat.aria', { seat: s.id, type: typeLabel(s.id), state })}
                    className={cn(
                      'grid h-[34px] place-items-center rounded-t-[11px] rounded-b-[7px] border text-[10px] font-bold transition-all duration-200',
                      s.taken
                        ? 'border-white/[0.05] bg-white/[0.025] text-fg-subtle/50'
                        : selected
                          ? 'scale-105 border-brand-orange bg-brand-orange text-ink-950 shadow-[0_8px_18px_-6px_rgba(243,99,36,0.9)]'
                          : row.legroom
                            ? 'border-sky/50 bg-sky/12 text-sky hover:bg-sky/20'
                            : 'border-white/12 bg-white/[0.1] text-transparent hover:bg-white/[0.18] hover:text-fg-muted',
                    )}
                  >
                    {s.taken ? <X className="size-3" /> : s.id}
                  </button>
                )
                return index === 3 ? (
                  <span key={`aisle-${row.row}`} className="contents">
                    <span className="text-center text-[11px] font-semibold tabular-nums text-fg-subtle">{row.row}</span>
                    {button}
                  </span>
                ) : (
                  button
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </Screen>
  )
}

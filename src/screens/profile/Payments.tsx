import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { useAppState, useDispatch, useI18n, useToast } from '@/state/store'
import { Badge, Card } from '@/ui/Misc'
import { Screen, ScreenHeader } from '@/ui/Screen'
import { AddCardSheet, CardBrandMark } from '../booking/AddCardSheet'

export function PaymentsScreen() {
  const { t } = useI18n()
  const { cards, defaultCardId } = useAppState()
  const dispatch = useDispatch()
  const toast = useToast()
  const [addOpen, setAddOpen] = useState(false)

  return (
    <Screen label={t('payments.title')} header={<ScreenHeader title={t('payments.title')} />} className="space-y-6 px-5 pb-10 pt-2">
      <section>
        <h2 className="mb-2.5 px-1 text-[12.5px] font-semibold uppercase tracking-[0.12em] text-fg-subtle">{t('payments.wallets')}</h2>
        <Card className="flex items-center gap-3.5 px-4 py-3.5">
          <CardBrandMark brand="apple" />
          <span className="flex-1 text-[15px] font-medium">{t('pay.applePay')}</span>
          <Check className="size-5 text-success" aria-hidden />
        </Card>
      </section>
      <section>
        <h2 className="mb-2.5 px-1 text-[12.5px] font-semibold uppercase tracking-[0.12em] text-fg-subtle">{t('payments.cards')}</h2>
        <Card className="divide-y divide-white/[0.06] overflow-hidden">
          {cards.map((card) => {
            const isDefault = card.id === defaultCardId
            return (
              <div key={card.id} className="flex items-center gap-3.5 px-4 py-3.5">
                <CardBrandMark brand={card.brand} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium" dir="auto">
                    {t('pay.card', { brand: card.brand, last4: card.last4 })}
                  </p>
                  <p className="text-[12px] text-fg-subtle">{t('pay.expires', { date: card.expiry })}</p>
                </div>
                {isDefault ? (
                  <Badge tone="orange">{t('payments.default')}</Badge>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      dispatch({ type: 'SET_DEFAULT_CARD', id: card.id })
                      toast(t('payments.defaultToast'))
                    }}
                    className="text-[12.5px] font-semibold text-orange-300 hover:text-orange-200"
                  >
                    {t('payments.makeDefault')}
                  </button>
                )}
              </div>
            )
          })}
          <button type="button" onClick={() => setAddOpen(true)} className="flex w-full items-center gap-3.5 px-4 py-3.5 text-start text-orange-300 transition-colors hover:bg-white/[0.03]">
            <span className="grid h-8 w-12 place-items-center rounded-[8px] border border-dashed border-orange-300/50">
              <Plus className="size-4" />
            </span>
            <span className="text-[14.5px] font-semibold">{t('pay.addCard')}</span>
          </button>
        </Card>
      </section>
      <AddCardSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </Screen>
  )
}

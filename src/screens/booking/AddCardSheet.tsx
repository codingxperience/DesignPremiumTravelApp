import { useEffect, useState } from 'react'
import { CreditCard } from 'lucide-react'
import type { PaymentCard } from '@/data/types'
import { useDispatch, useI18n, useToast } from '@/state/store'
import { Button } from '@/ui/Button'
import { TextField } from '@/ui/Field'
import { Sheet } from '@/ui/Overlay'

function detectBrand(digits: string): PaymentCard['brand'] {
  if (/^3[47]/.test(digits)) return 'Amex'
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard'
  return 'Visa'
}

function formatNumber(digits: string, brand: PaymentCard['brand']): string {
  if (brand === 'Amex') return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)].filter(Boolean).join(' ')
  return digits.match(/.{1,4}/g)?.join(' ') ?? ''
}

export function CardBrandMark({ brand }: { brand: PaymentCard['brand'] | 'apple' }) {
  if (brand === 'apple') {
    return (
      <span className="grid h-8 w-12 place-items-center rounded-[8px] bg-black text-[12px] font-semibold text-white ring-1 ring-white/15">
        <span className="flex items-center gap-0.5">
          <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden>
            <path d="M16.37 1.43c0 1.14-.5 2.27-1.18 3.08-.75.9-1.99 1.57-2.99 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.57-2.27 1.21-2.98.8-.94 2.14-1.64 3.25-1.68.03.13.05.28.05.43zm4.56 15.71c-.03.07-.46 1.58-1.52 3.12-.94 1.34-1.94 2.71-3.43 2.71-1.52 0-1.9-.88-3.63-.88-1.7 0-2.3.91-3.67.91-1.38 0-2.33-1.26-3.43-2.8-1.29-1.82-2.32-4.63-2.32-7.28 0-4.28 2.8-6.55 5.55-6.55 1.45 0 2.68.95 3.6.95.87 0 2.22-1.01 3.9-1.01.62 0 2.89.06 4.38 2.19-.13.09-2.38 1.37-2.38 4.19 0 3.26 2.85 4.42 2.95 4.45z" />
          </svg>
          Pay
        </span>
      </span>
    )
  }
  if (brand === 'Mastercard') {
    return (
      <span className="relative grid h-8 w-12 place-items-center rounded-[8px] bg-white ring-1 ring-white/15" aria-hidden>
        <span className="absolute size-[18px] -translate-x-[5px] rounded-full bg-[#EB001B]" />
        <span className="absolute size-[18px] translate-x-[5px] rounded-full bg-[#F79E1B] mix-blend-multiply" />
      </span>
    )
  }
  return (
    <span
      className={`grid h-8 w-12 place-items-center rounded-[8px] text-[11px] font-black italic tracking-[0.02em] ring-1 ring-white/15 ${brand === 'Amex' ? 'bg-[#2E77BC] text-white' : 'bg-white text-[#1A1F71]'}`}
      aria-hidden
    >
      {brand === 'Amex' ? 'AMEX' : 'VISA'}
    </span>
  )
}

export function AddCardSheet({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded?: (id: string) => void }) {
  const { t } = useI18n()
  const dispatch = useDispatch()
  const toast = useToast()
  const [digits, setDigits] = useState('')
  const [name, setName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!open) return
    setDigits('')
    setName('')
    setExpiry('')
    setCvc('')
    setSubmitted(false)
  }, [open])

  const brand = detectBrand(digits)
  const requiredLength = brand === 'Amex' ? 15 : 16
  const [month, year] = expiry.split('/').map(Number)
  const now = new Date()
  const expiryValid =
    month >= 1 && month <= 12 && year >= now.getFullYear() % 100 && (year > now.getFullYear() % 100 || month >= now.getMonth() + 1)
  const errors = {
    number: digits.length !== requiredLength,
    name: name.trim().length < 2,
    expiry: !expiryValid,
    cvc: cvc.length !== (brand === 'Amex' ? 4 : 3),
  }
  const valid = !Object.values(errors).some(Boolean)

  const save = () => {
    setSubmitted(true)
    if (!valid) return
    const card: PaymentCard = { id: `card-${digits.slice(-4)}-${expiry.replace('/', '')}`, brand, last4: digits.slice(-4), expiry }
    dispatch({ type: 'ADD_CARD', card })
    toast(t('card.added'))
    onAdded?.(card.id)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={t('card.title')} label={t('card.title')} footer={<Button block onClick={save}>{t('card.save')}</Button>}>
      <div className="space-y-4">
        <TextField
          label={t('card.number')}
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="4242 4242 4242 4242"
          icon={<CreditCard />}
          trailing={digits.length > 0 ? <CardBrandMark brand={brand} /> : undefined}
          value={formatNumber(digits, brand)}
          onChange={(event) => setDigits(event.target.value.replace(/\D/g, '').slice(0, 16))}
          error={submitted && errors.number ? t('card.numberError') : undefined}
          ltr
        />
        <TextField
          label={t('card.name')}
          autoComplete="cc-name"
          placeholder="AHMED MOHAMED"
          value={name}
          onChange={(event) => setName(event.target.value.toUpperCase())}
          error={submitted && errors.name ? t('card.nameError') : undefined}
          ltr
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label={t('card.expiry')}
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="08/29"
            value={expiry}
            onChange={(event) => {
              const raw = event.target.value.replace(/\D/g, '').slice(0, 4)
              setExpiry(raw.length > 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw)
            }}
            error={submitted && errors.expiry ? t('card.expiryError') : undefined}
            ltr
          />
          <TextField
            label={t('card.cvc')}
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            type="password"
            value={cvc}
            onChange={(event) => setCvc(event.target.value.replace(/\D/g, '').slice(0, 4))}
            error={submitted && errors.cvc ? t('card.cvcError') : undefined}
            ltr
          />
        </div>
      </div>
    </Sheet>
  )
}

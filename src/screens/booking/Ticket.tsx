import { useState } from 'react'
import { Download } from 'lucide-react'
import { useAppState, useI18n, useToast } from '@/state/store'
import { Button } from '@/ui/Button'
import { Segmented } from '@/ui/Controls'
import { AppleIcon } from '@/ui/Icons'
import { Screen, ScreenHeader } from '@/ui/Screen'
import { BoardingPass } from './BoardingPass'

export function TicketScreen({ bookingId }: { bookingId: string }) {
  const { t } = useI18n()
  const { bookings } = useAppState()
  const toast = useToast()
  const booking = bookings.find((b) => b.id === bookingId)
  const [segment, setSegment] = useState<'outbound' | 'inbound'>('outbound')
  if (!booking?.flight) return null

  return (
    <Screen label={t('ticket.title')} header={<ScreenHeader title={t('ticket.title')} subtitle={booking.ref} />} className="px-5 pb-10 pt-2">
      {booking.flight.inbound && (
        <Segmented
          className="mb-5"
          label={t('ticket.title')}
          value={segment}
          onChange={setSegment}
          options={[
            { value: 'outbound', label: t('flights.outbound') },
            { value: 'inbound', label: t('flights.inbound') },
          ]}
        />
      )}
      <BoardingPass booking={booking} segment={segment} />
      <div className="mt-6 space-y-3">
        <Button block variant="black" icon={<AppleIcon className="size-5" />} onClick={() => toast(t('ticket.walletToast'))}>
          {t('ticket.wallet')}
        </Button>
        <Button block variant="secondary" icon={<Download className="size-5" />} onClick={() => toast(t('ticket.downloadToast'))}>
          {t('ticket.download')}
        </Button>
      </div>
    </Screen>
  )
}

import { CAIRO_QUERY } from '@/data/demo'
import type { ChatMessage } from '@/data/types'

type Reply = Pick<ChatMessage, 'key' | 'card' | 'dateParam'>

/** Picks the concierge's scripted reply from keywords in English or Arabic. */
export function conciergeReply(text: string): Reply {
  const message = text.toLowerCase()
  const has = (...words: string[]) => words.some((word) => message.includes(word))

  if (has('approval', 'visa', 'status', 'security', 'موافق', 'تأشير', 'حالة')) return { key: 'chat.reply.visa', card: 'approval' }
  if (has('book', 'change', 'cancel', 'trip', 'cairo', 'حجز', 'تعديل', 'إلغاء', 'رحلت', 'القاهرة')) {
    return { key: 'chat.reply.booking', dateParam: CAIRO_QUERY.depart }
  }
  if (has('umrah', 'hajj', 'ramadan', 'makkah', 'mecca', 'عمر', 'حج', 'رمضان', 'مكة')) return { key: 'chat.reply.umrah' }
  if (has('call', 'phone', 'ring', 'اتصل', 'اتصال', 'هاتف')) return { key: 'chat.reply.call' }
  if (has('thank', 'cheers', 'شكر')) return { key: 'chat.reply.thanks' }
  if (/\b(hi|hey|hello|salam|salaam)\b/.test(message) || has('مرحب', 'السلام', 'أهل', 'اهل')) {
    return { key: 'chat.reply.greeting' }
  }
  return { key: 'chat.reply.fallback' }
}

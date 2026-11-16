import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Check, CheckCheck, Clock3, Mic, Paperclip, Phone, SendHorizontal } from 'lucide-react'
import { LogoMark } from '@/brand/Logo'
import { CONTACT } from '@/data/demo'
import type { ChatMessage } from '@/data/types'
import { cn } from '@/lib/cn'
import { PHOTOS } from '@/lib/images'
import type { TKey } from '@/lib/i18n'
import type { NavStyle } from '@/state/routes'
import { useAppState, useDispatch, useI18n, useNav, useToast } from '@/state/store'
import { IconButton } from '@/ui/Button'
import { Flag } from '@/ui/Flag'
import { WhatsAppIcon } from '@/ui/Icons'
import { EASE_OUT, FLIP_RTL } from '@/ui/motion'
import { Avatar } from '../explore/shared'
import { applicationInfo, StatusProgress } from '../services/status'

/** Distance from the bottom edge to the top of each navigation bar, so the composer always clears it. */
const NAV_CLEARANCE: Record<NavStyle, number> = { orbit: 106, capsule: 80, ticket: 86 }

const QUICK_REPLIES: TKey[] = ['chat.quick.visa', 'chat.quick.booking', 'chat.quick.umrah', 'chat.quick.call']

function ApprovalCard() {
  const { t, L } = useI18n()
  const { applications } = useAppState()
  const { push } = useNav()
  const application = applications.find((a) => a.id === 'ap-egypt') ?? applications[0]
  if (!application) return null
  const info = applicationInfo(application)
  return (
    <div className="mt-2.5 rounded-2xl border border-white/10 bg-ink-850/80 p-3">
      <div className="flex items-center gap-2.5">
        <Flag code={info.flag} className="size-7" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-semibold">{L(info.title)}</p>
          <p className="text-[11.5px] text-fg-subtle" dir="ltr">
            {application.ref}
          </p>
        </div>
      </div>
      <div className="mt-3">
        <StatusProgress status={application.status} />
      </div>
      <button
        type="button"
        onClick={() => push({ name: 'applicationStatus', id: application.id })}
        className="mt-3 h-9 w-full rounded-xl bg-white/[0.08] text-[13px] font-semibold text-orange-200 transition-colors hover:bg-white/[0.12]"
      >
        {t('chat.card.cta')}
      </button>
    </div>
  )
}

function Bubble({ message }: { message: ChatMessage }) {
  const { t, clock, date } = useI18n()
  const mine = message.from === 'user'
  const body = message.text ?? (message.key ? t(message.key, message.dateParam ? { date: date(message.dateParam, { day: 'numeric', month: 'long' }) } : undefined) : '')
  return (
    <motion.li
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
      className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}
    >
      <div
        className={cn(
          'max-w-[80%] px-4 py-2.5 text-[14.5px] leading-relaxed',
          mine ? 'rounded-[20px] rounded-ee-[6px] bg-brand-blue text-white' : 'rounded-[20px] rounded-es-[6px] bg-white/[0.07] text-fg',
        )}
      >
        <p dir={message.text ? 'auto' : undefined} className="whitespace-pre-line">
          {body}
        </p>
        {message.card === 'approval' && <ApprovalCard />}
      </div>
      <span className="mt-1 flex items-center gap-1 px-1 text-[11px] text-fg-subtle">
        {clock(new Date(message.at))}
        {mine &&
          (message.read ? (
            <CheckCheck className="size-3.5 text-sky" aria-label={t('chat.read')} />
          ) : (
            <Check className="size-3.5" aria-hidden />
          ))}
      </span>
    </motion.li>
  )
}

function Typing() {
  const { t } = useI18n()
  return (
    <motion.li initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-start" aria-label={t('chat.typing')}>
      <div className="flex gap-1 rounded-[20px] rounded-es-[6px] bg-white/[0.07] px-4 py-3.5">
        {[0, 1, 2].map((dot) => (
          <motion.span
            key={dot}
            className="size-2 rounded-full bg-fg-muted"
            animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: dot * 0.15 }}
          />
        ))}
      </div>
    </motion.li>
  )
}

export function SupportScreen() {
  const { t } = useI18n()
  const { chat, agentTyping, tab, stack, navStyle } = useAppState()
  const dispatch = useDispatch()
  const toast = useToast()
  const [text, setText] = useState('')
  const scroller = useRef<HTMLDivElement>(null)
  const visible = tab === 'support' && stack.length === 0
  const clearance = NAV_CLEARANCE[navStyle]

  useEffect(() => {
    if (visible) dispatch({ type: 'CHAT_SEEN' })
  }, [visible, chat.length, dispatch])

  useEffect(() => {
    const element = scroller.current
    if (element) element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' })
  }, [chat.length, agentTyping, visible])

  const send = (value: string) => {
    const message = value.trim()
    if (!message) return
    dispatch({ type: 'CHAT_SEND', text: message })
    setText('')
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    send(text)
  }

  return (
    <section aria-label={t('nav.support')} className="absolute inset-0 flex flex-col bg-ink-900">
      <header className="relative z-10 border-b border-white/[0.06] bg-ink-900/85 px-4 pb-3 pt-[calc(var(--sat)+10px)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="relative">
            <Avatar id={PHOTOS.mariam} alt={t('chat.agentName')} className="size-12" />
            <span aria-hidden className="absolute bottom-0 end-0 size-3.5 rounded-full bg-success ring-[3px] ring-ink-900" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-semibold">
              {t('chat.agentName')} <span className="text-[13px] font-medium text-fg-muted">· {t('chat.agentRole')}</span>
            </p>
            <p className={cn('text-[12.5px]', agentTyping ? 'text-orange-300' : 'text-success')} aria-live="polite">
              {agentTyping ? t('chat.typing') : t('chat.online')}
            </p>
          </div>
          <a href={CONTACT.phoneHref} aria-label={t('chat.callAria')} className="grid size-11 place-items-center rounded-full border border-white/10 bg-white/[0.05] transition-colors hover:bg-white/[0.09]">
            <Phone className="size-5" />
          </a>
          <a
            href={CONTACT.whatsappHref}
            target="_blank"
            rel="noreferrer"
            aria-label={t('chat.whatsappAria')}
            className="grid size-11 place-items-center rounded-full bg-[#25D366]/15 text-[#5be38f] transition-colors hover:bg-[#25D366]/25"
          >
            <WhatsAppIcon className="size-5" />
          </a>
        </div>
      </header>

      <div ref={scroller} className="no-scrollbar relative flex-1 overflow-y-auto overscroll-contain px-4" style={{ paddingBottom: clearance + 116 }}>
        <div className="mx-auto mt-5 flex max-w-[290px] flex-col items-center rounded-[22px] border border-white/[0.07] bg-white/[0.03] px-5 py-4 text-center">
          <LogoMark className="h-7 w-auto" />
          <p className="mt-3 text-[13px] font-semibold">{t('brand.full')}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-fg-muted">
            <Clock3 className="size-3.5" />
            {t('brand.hours')}
          </p>
        </div>
        <p className="my-5 text-center text-[11.5px] font-semibold uppercase tracking-[0.12em] text-fg-subtle">{t('chat.today')}</p>
        <ul className="space-y-3" aria-live="polite">
          {chat.map((message) => (
            <Bubble key={message.id} message={message} />
          ))}
          <AnimatePresence>{agentTyping && <Typing />}</AnimatePresence>
        </ul>
      </div>

      <div className="absolute inset-x-0 z-20 px-3" style={{ bottom: `calc(var(--sab) + ${clearance}px)` }}>
        <div className="no-scrollbar -mx-3 mb-2.5 flex gap-2 overflow-x-auto px-3">
          {QUICK_REPLIES.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => send(t(key))}
              className="glass h-9 shrink-0 rounded-full px-3.5 text-[13px] font-medium text-fg transition-colors hover:bg-white/10"
            >
              {t(key)}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="flex items-center gap-2">
          <IconButton label={t('chat.attach')} variant="glass" onClick={() => toast(t('chat.attachToast'))}>
            <Paperclip />
          </IconButton>
          <div className="glass flex h-12 min-w-0 flex-1 items-center rounded-full px-4 focus-within:border-brand-orange/60">
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={t('chat.placeholder')}
              aria-label={t('chat.placeholder')}
              dir="auto"
              enterKeyHint="send"
              className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-fg-subtle focus-visible:outline-none"
            />
          </div>
          <AnimatePresence mode="popLayout" initial={false}>
            {text.trim() ? (
              <motion.button
                key="send"
                type="submit"
                aria-label={t('chat.send')}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                whileTap={{ scale: 0.9 }}
                className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-orange text-ink-950"
              >
                <SendHorizontal className={cn('size-5', FLIP_RTL)} />
              </motion.button>
            ) : (
              <motion.button
                key="mic"
                type="button"
                aria-label={t('chat.voice')}
                onClick={() => toast(t('chat.voiceToast'))}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                whileTap={{ scale: 0.9 }}
                className="glass grid size-12 shrink-0 place-items-center rounded-full text-fg"
              >
                <Mic className="size-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </form>
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[220px] bg-[linear-gradient(0deg,#081226_45%,rgba(8,18,38,0))]" />
    </section>
  )
}

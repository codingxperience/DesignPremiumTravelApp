import { AnimatePresence, motion } from 'motion/react'
import { useCallback } from 'react'
import { MessageCircle, Plane, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { SERVICE_ROUTES, type ServiceId } from '@/state/routes'
import { useAppState, useI18n, useNav } from '@/state/store'
import { Heading } from '@/ui/Heading'
import { OverlayPortal, useEscape, useFocusReturn } from '@/ui/Overlay'
import { EASE_OUT, SOFT_SPRING } from '@/ui/motion'
import { SERVICES } from './items'

const RADIUS = 116
// Distance from the dock's launcher up to the ring centre, so the globe appears to lift off.
const LAUNCH_OFFSET = 300

/** Services arranged in orbit around the globe, echoing the plane circling the Cross World mark. */
export function ServicesOrbit() {
  const { servicesOpen } = useAppState()
  const { openServices, push, setTab } = useNav()
  const { t, isRtl } = useI18n()
  const close = useCallback(() => openServices(false), [openServices])
  const dialog = useFocusReturn(servicesOpen)
  useEscape(servicesOpen, close)

  const choose = (id: ServiceId) => push(SERVICE_ROUTES[id])

  return (
    <OverlayPortal>
      <AnimatePresence>
        {servicesOpen && (
          <motion.div
            key="orbit"
            ref={dialog}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={t('services.title')}
            className="absolute inset-0 outline-none"
          >
            <motion.div
              className="absolute inset-0 bg-ink-950/80 backdrop-blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.1 } }}
              transition={{ duration: 0.35 }}
              onClick={close}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-[55%] size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(22,69,137,0.55),transparent_62%)]"
            />

            <motion.div
              className="pointer-events-none absolute inset-x-0 top-[calc(var(--sat)+40px)] px-8 text-center"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.1 }}
            >
              <p className="overline text-orange-300">{t('brand.tagline')}</p>
              <Heading size="lg" className="mt-3">
                {t('services.title')}
              </Heading>
              <p className="mx-auto mt-2 max-w-[260px] text-[14px] leading-relaxed text-fg-muted">{t('services.subtitle')}</p>
            </motion.div>

            <div className="absolute left-1/2 top-[55%] size-0">
              <motion.svg
                aria-hidden
                viewBox="0 0 360 360"
                className="pointer-events-none absolute -left-[180px] -top-[180px] size-[360px]"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.6, ease: EASE_OUT }}
              >
                <circle cx="180" cy="180" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1.25" strokeDasharray="3 7" />
                <circle cx="180" cy="180" r="172" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              </motion.svg>

              <motion.div
                aria-hidden
                className="pointer-events-none absolute"
                style={{ left: -RADIUS, top: -RADIUS, width: RADIUS * 2, height: RADIUS * 2 }}
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ opacity: 1, rotate: isRtl ? -360 : 360 }}
                exit={{ opacity: 0 }}
                transition={{ opacity: { duration: 0.4, delay: 0.5 }, rotate: { duration: 18, ease: 'linear', repeat: Infinity } }}
              >
                <span className="absolute left-1/2 top-0 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ink-900 text-orange-300 ring-1 ring-white/15">
                  <Plane className={cn('size-3.5', isRtl ? '-rotate-[135deg]' : 'rotate-45')} />
                </span>
              </motion.div>

              {SERVICES.map((service, index) => {
                const angle = ((-90 + index * 60) * Math.PI) / 180
                const x = Math.cos(angle) * RADIUS * (isRtl ? -1 : 1)
                const y = Math.sin(angle) * RADIUS
                const Icon = service.icon
                return (
                  <motion.button
                    key={service.id}
                    type="button"
                    onClick={() => choose(service.id)}
                    className="group absolute -left-[48px] -top-[31px] flex w-24 flex-col items-center gap-2"
                    initial={{ x: 0, y: LAUNCH_OFFSET * 0.25, scale: 0.3, opacity: 0 }}
                    animate={{ x, y, scale: 1, opacity: 1 }}
                    exit={{ x: 0, y: 0, scale: 0.3, opacity: 0, transition: { duration: 0.25, ease: EASE_OUT } }}
                    transition={{ ...SOFT_SPRING, delay: 0.08 + index * 0.04 }}
                  >
                    <span className="relative grid size-[62px] place-items-center rounded-full border border-white/12 bg-[linear-gradient(160deg,rgba(46,98,180,0.55),rgba(14,28,56,0.9))] text-white shadow-[0_18px_30px_-16px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.12)] transition-transform duration-300 group-hover:scale-105">
                      <Icon className="size-6" />
                      {service.offer && (
                        <span className="absolute -end-1 -top-1 rounded-full bg-brand-orange px-1.5 py-0.5 text-[9.5px] font-bold text-ink-950 shadow">
                          {t('services.offer')}
                        </span>
                      )}
                    </span>
                    <span className="line-clamp-2 text-center text-[12px] font-semibold leading-tight text-fg">{t(service.label)}</span>
                  </motion.button>
                )
              })}

              <motion.button
                type="button"
                onClick={close}
                aria-label={t('nav.closeServices')}
                className="absolute -left-9 -top-9 grid size-[72px] place-items-center rounded-full text-ink-950"
                initial={{ y: LAUNCH_OFFSET, scale: 0.85 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: LAUNCH_OFFSET, scale: 0.85, transition: { duration: 0.4, ease: EASE_OUT } }}
                transition={{ type: 'spring', stiffness: 210, damping: 24 }}
                whileTap={{ scale: 0.92 }}
              >
                <span aria-hidden className="absolute -inset-2 rounded-full border border-brand-orange/30" />
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_24%,#ffa06a_0%,#f36324_52%,#c2470f_100%)] shadow-[0_20px_40px_-12px_rgba(243,99,36,0.9),inset_0_1px_0_rgba(255,255,255,0.4)]"
                />
                <X className="relative size-7" strokeWidth={2.25} />
              </motion.button>
            </div>

            <motion.div
              className="absolute inset-x-0 bottom-[calc(var(--sab)+26px)] flex flex-col items-center gap-2 px-8 text-center"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.3 }}
            >
              <p className="text-[13px] text-fg-muted">{t('services.help')}</p>
              <button
                type="button"
                onClick={() => setTab('support')}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-4 text-[13.5px] font-semibold text-fg transition-colors hover:bg-white/[0.1]"
              >
                <MessageCircle className="size-4 text-orange-300" />
                {t('services.helpCta')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </OverlayPortal>
  )
}

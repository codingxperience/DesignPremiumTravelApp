import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { LogoMark } from '@/brand/Logo'
import { cn } from '@/lib/cn'
import type { TKey } from '@/lib/i18n'
import { PHOTOS } from '@/lib/images'
import { useDispatch, useI18n } from '@/state/store'
import { Button } from '@/ui/Button'
import { Heading } from '@/ui/Heading'
import { Img } from '@/ui/Img'
import { EASE_OUT, FLIP_RTL } from '@/ui/motion'

const SLIDES: { image: string; kicker: TKey; title: TKey; body: TKey }[] = [
  { image: PHOTOS.wingSunset, kicker: 'onb.1.kicker', title: 'onb.1.title', body: 'onb.1.body' },
  { image: PHOTOS.sphinxWalk, kicker: 'onb.2.kicker', title: 'onb.2.title', body: 'onb.2.body' },
  { image: PHOTOS.kaaba, kicker: 'onb.3.kicker', title: 'onb.3.title', body: 'onb.3.body' },
]

export function OnboardingScreen() {
  const [index, setIndex] = useState(0)
  const dispatch = useDispatch()
  const { t, isRtl } = useI18n()
  const slide = SLIDES[index]
  const last = index === SLIDES.length - 1

  const toAuth = (screen: 'signin' | 'signup') => dispatch({ type: 'AUTH_GO', screen, dir: 1 })
  const go = (next: number) => setIndex(Math.min(SLIDES.length - 1, Math.max(0, next)))

  return (
    <section aria-roledescription="carousel" className="absolute inset-0 overflow-hidden bg-ink-950">
      <AnimatePresence initial={false}>
        <motion.div
          key={slide.image}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: EASE_OUT }}
        >
          <Img id={slide.image} width={390} height={844} priority alt="" className="size-full" />
        </motion.div>
      </AnimatePresence>
      <div aria-hidden className="absolute inset-x-0 top-0 h-48 bg-[linear-gradient(180deg,rgba(5,11,23,0.7),transparent)]" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[64%] bg-[linear-gradient(0deg,#050b17_8%,rgba(5,11,23,0.88)_42%,transparent)]" />

      <motion.div
        aria-hidden
        className="absolute inset-0 touch-pan-y"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        onDragEnd={(_, info) => {
          const distance = info.offset.x * (isRtl ? -1 : 1)
          if (distance < -50) go(index + 1)
          else if (distance > 50) go(index - 1)
        }}
      />

      <div className="absolute inset-x-0 top-[calc(var(--sat)+8px)] flex items-center justify-between px-6">
        <LogoMark className="h-7 w-auto" title={t('brand.full')} />
        {!last && (
          <button type="button" onClick={() => toAuth('signin')} className="glass-dark h-9 rounded-full px-4 text-[13px] font-semibold text-white">
            {t('onb.skip')}
          </button>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-[calc(var(--sab)+20px)] [&_button]:pointer-events-auto">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            aria-live="polite"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
          >
            <p className="overline text-orange-300">{t(slide.kicker)}</p>
            <Heading as="h1" size="2xl" className="mt-4 text-white">
              {t(slide.title)}
            </Heading>
            <p className="mt-4 max-w-[320px] text-[15px] leading-relaxed text-fg-muted">{t(slide.body)}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-9 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {SLIDES.map((item, i) => (
              <button
                key={item.image}
                type="button"
                onClick={() => go(i)}
                aria-label={t('onb.slide', { n: i + 1, total: SLIDES.length })}
                aria-current={i === index ? 'step' : undefined}
                className="grid h-6 place-items-center"
              >
                <span className={cn('block h-1.5 rounded-full transition-all duration-500 ease-ios', i === index ? 'w-8 bg-brand-orange' : 'w-1.5 bg-white/30')} />
              </button>
            ))}
          </div>
          <AnimatePresence mode="popLayout" initial={false}>
            {last ? (
              <motion.div key="start" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, ease: EASE_OUT }}>
                <Button onClick={() => toAuth('signup')} iconEnd={<ArrowRight className={cn('size-5', FLIP_RTL)} />}>
                  {t('onb.getStarted')}
                </Button>
              </motion.div>
            ) : (
              <motion.button
                key="next"
                type="button"
                onClick={() => go(index + 1)}
                aria-label={t('onb.next')}
                whileTap={{ scale: 0.92 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="grid size-14 place-items-center rounded-[18px] bg-brand-orange text-ink-950 shadow-[0_16px_34px_-16px_rgba(243,99,36,0.95)]"
              >
                <ArrowRight className={cn('size-6', FLIP_RTL)} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        <div className="mt-4 h-10 text-center">
          {last && (
            <button type="button" onClick={() => toAuth('signin')} className="h-10 text-[14px] font-semibold text-fg-muted transition-colors hover:text-fg">
              {t('onb.haveAccount')}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

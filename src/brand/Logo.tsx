import { motion } from 'motion/react'
import { cn } from '@/lib/cn'
import { EASE_OUT } from '@/ui/motion'
import { GLOBE_VIEWBOX, LOCKUP_VIEWBOX, LOGO_PATHS, MARK_VIEWBOX } from './logo-paths'

export const BRAND_BLUE = '#164589'
export const BRAND_ORANGE = '#F36324'

/**
 * `dark` reproduces the logo as it appears on brand blue (orange crescent, white
 * globe and strokes); `light` is the full-colour version for white surfaces.
 */
type Tone = 'dark' | 'light' | 'mono'

function palette(tone: Tone) {
  if (tone === 'light') {
    return { crescent: BRAND_BLUE, globe: BRAND_BLUE, strokes: BRAND_ORANGE, word1: BRAND_BLUE, word2: BRAND_ORANGE }
  }
  if (tone === 'mono') {
    return { crescent: 'currentColor', globe: 'currentColor', strokes: 'currentColor', word1: 'currentColor', word2: 'currentColor' }
  }
  return { crescent: BRAND_ORANGE, globe: '#FFFFFF', strokes: '#FFFFFF', word1: '#FFFFFF', word2: '#FFFFFF' }
}

type LogoProps = { tone?: Tone; className?: string; title?: string }

function MarkPaths({ tone }: { tone: Tone }) {
  const colors = palette(tone)
  return (
    <>
      <path fill={colors.crescent} fillRule="evenodd" d={LOGO_PATHS.crescent} />
      <path fill={colors.globe} fillRule="evenodd" d={LOGO_PATHS.globe} />
      <path fill={colors.strokes} fillRule="evenodd" d={LOGO_PATHS.stroke1} />
      <path fill={colors.strokes} fillRule="evenodd" d={LOGO_PATHS.stroke2} />
      <path fill={colors.strokes} fillRule="evenodd" d={LOGO_PATHS.stroke3} />
    </>
  )
}

export function LogoMark({ tone = 'dark', className, title }: LogoProps) {
  return (
    <svg viewBox={MARK_VIEWBOX} className={className} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <MarkPaths tone={tone} />
    </svg>
  )
}

export function LogoLockup({ tone = 'dark', className, title = 'Cross World Travel and Tourism' }: LogoProps) {
  const colors = palette(tone)
  return (
    <svg viewBox={LOCKUP_VIEWBOX} className={className} role="img" aria-label={title}>
      <MarkPaths tone={tone} />
      <path fill={colors.word1} fillRule="evenodd" d={LOGO_PATHS.word1} />
      <path fill={colors.word2} fillRule="evenodd" d={LOGO_PATHS.word2} />
    </svg>
  )
}

/** The globe-and-plane from the mark, used as the signature icon of the Orbit navigation. */
export function GlobeGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox={GLOBE_VIEWBOX} className={className} aria-hidden="true">
      <path fill="currentColor" fillRule="evenodd" d={LOGO_PATHS.globe} />
    </svg>
  )
}

/** Splash reveal: crescent sweeps in, the globe lands, the three strokes follow like speed lines. */
export function AnimatedLockup({ className }: { className?: string }) {
  const colors = palette('dark')
  const strokes = [LOGO_PATHS.stroke1, LOGO_PATHS.stroke2, LOGO_PATHS.stroke3]
  return (
    <svg viewBox={LOCKUP_VIEWBOX} className={cn('overflow-visible', className)} role="img" aria-label="Cross World Travel and Tourism">
      <motion.path
        fill={colors.crescent}
        fillRule="evenodd"
        d={LOGO_PATHS.crescent}
        initial={{ opacity: 0, rotate: -40, scale: 0.85 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.25 }}
      />
      <motion.path
        fill={colors.globe}
        fillRule="evenodd"
        d={LOGO_PATHS.globe}
        initial={{ opacity: 0, scale: 0.55 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 170, damping: 16, delay: 0.1 }}
      />
      {strokes.map((d, i) => (
        <motion.path
          key={i}
          fill={colors.strokes}
          fillRule="evenodd"
          d={d}
          initial={{ opacity: 0, x: -70, y: 60 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.45 + i * 0.12 }}
        />
      ))}
      <motion.g initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE_OUT, delay: 1 }}>
        <path fill={colors.word1} fillRule="evenodd" d={LOGO_PATHS.word1} />
        <path fill={colors.word2} fillRule="evenodd" d={LOGO_PATHS.word2} />
      </motion.g>
    </svg>
  )
}

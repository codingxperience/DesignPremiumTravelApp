import type { Transition } from 'motion/react'

export const EASE_IOS: [number, number, number, number] = [0.32, 0.72, 0, 1]
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]

export const PAGE_TRANSITION: Transition = { type: 'tween', duration: 0.44, ease: EASE_IOS }
export const SPRING: Transition = { type: 'spring', stiffness: 420, damping: 36, mass: 0.9 }
export const SOFT_SPRING: Transition = { type: 'spring', stiffness: 240, damping: 26 }
export const SHEET_SPRING: Transition = { type: 'spring', stiffness: 380, damping: 40, mass: 0.9 }

/** Entrance used for staggered content blocks. */
export function rise(delay = 0) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, ease: EASE_OUT, delay },
  }
}

/** Mirrors directional icons (arrows, chevrons, planes) in right-to-left layouts. */
export const FLIP_RTL = 'rtl:-scale-x-100'

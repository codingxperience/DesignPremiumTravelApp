import { MotionConfig } from 'motion/react'
import { Showcase } from './shell/Showcase'
import { StoreProvider } from './state/store'

/** Application root: global state, motion preferences and the device showcase. */
export function Root() {
  return (
    <StoreProvider>
      <MotionConfig reducedMotion="user">
        <Showcase />
      </MotionConfig>
    </StoreProvider>
  )
}

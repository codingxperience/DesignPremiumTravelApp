import { useId } from 'react'
import type { FlagCode } from '@/data/types'
import { cn } from '@/lib/cn'

/** Simplified circular flags, drawn as SVG so they render identically on every platform. */
function FlagArt({ code }: { code: FlagCode }) {
  switch (code) {
    case 'gb':
      return (
        <>
          <rect width="32" height="32" fill="#012169" />
          <path d="M0 0 32 32M32 0 0 32" stroke="#fff" strokeWidth="6" />
          <path d="M0 0 32 32M32 0 0 32" stroke="#C8102E" strokeWidth="2" />
          <path d="M16 0v32M0 16h32" stroke="#fff" strokeWidth="10" />
          <path d="M16 0v32M0 16h32" stroke="#C8102E" strokeWidth="6" />
        </>
      )
    case 'eg':
      return (
        <>
          <rect width="32" height="11" fill="#CE1126" />
          <rect y="11" width="32" height="10" fill="#fff" />
          <rect y="21" width="32" height="11" fill="#000" />
          <path d="M14.6 12.6h2.8l-.5 4.6h-1.8z" fill="#C09300" />
        </>
      )
    case 'sa':
      return (
        <>
          <rect width="32" height="32" fill="#006C35" />
          <path d="M8 12.4c1.8-1 3.2 1 5 0s3.2-1 5 0 3.2 1 6 0M8 15.8c1.8-1 3.2 1 5 0s3.2-1 5 0 3.2 1 6 0" stroke="#fff" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <path d="M9 20.6h12.5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
          <path d="m21.2 19.5 2.3 1.1-2.3 1.1z" fill="#fff" />
        </>
      )
    case 'ae':
      return (
        <>
          <rect width="32" height="11" fill="#00732F" />
          <rect y="11" width="32" height="10" fill="#fff" />
          <rect y="21" width="32" height="11" fill="#000" />
          <rect width="10" height="32" fill="#FF0000" />
        </>
      )
    case 'tr':
      return (
        <>
          <rect width="32" height="32" fill="#E30A17" />
          <circle cx="13.5" cy="16" r="6.4" fill="#fff" />
          <circle cx="15.1" cy="16" r="5.1" fill="#E30A17" />
          <path d="M21.6 16 25.58 14.71 23.12 18.09V13.91L25.58 17.29Z" fill="#fff" />
        </>
      )
    case 'us':
      return (
        <>
          <rect width="32" height="32" fill="#fff" />
          {[0, 2, 4, 6, 8, 10, 12].map((i) => (
            <rect key={i} y={i * 2.46} width="32" height="2.46" fill="#B22234" />
          ))}
          <rect width="15" height="17.2" fill="#3C3B6E" />
          {[3, 7.5, 12].map((x) => [4, 8.6, 13].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.9" fill="#fff" />))}
        </>
      )
    case 'eu':
      return (
        <>
          <rect width="32" height="32" fill="#003399" />
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i / 12) * Math.PI * 2
            return <circle key={i} cx={16 + Math.cos(angle) * 8.5} cy={16 + Math.sin(angle) * 8.5} r="1.25" fill="#FFCC00" />
          })}
        </>
      )
    case 'sd':
      return (
        <>
          <rect width="32" height="11" fill="#D21034" />
          <rect y="11" width="32" height="10" fill="#fff" />
          <rect y="21" width="32" height="11" fill="#000" />
          <path d="M0 0 13 16 0 32z" fill="#007229" />
        </>
      )
    case 'ma':
      return (
        <>
          <rect width="32" height="32" fill="#C1272D" />
          <path d="m16 9.2 4 12.3-10.5-7.6h13L12 21.5z" fill="none" stroke="#006233" strokeWidth="1.4" strokeLinejoin="round" />
        </>
      )
  }
}

export function Flag({ code, className, label }: { code: FlagCode; className?: string; label?: string }) {
  const clipId = useId()
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn('size-6 shrink-0 rounded-full ring-1 ring-white/15', className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <clipPath id={clipId}>
        <circle cx="16" cy="16" r="16" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <FlagArt code={code} />
      </g>
    </svg>
  )
}

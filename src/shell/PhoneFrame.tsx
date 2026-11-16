import type { ReactNode } from "react";

export const SCREEN_WIDTH = 390;
export const SCREEN_HEIGHT = 844;
const BEZEL = 12;
export const FRAME_WIDTH = SCREEN_WIDTH + BEZEL * 2;
export const FRAME_HEIGHT = SCREEN_HEIGHT + BEZEL * 2;

/** A 390 × 844 device frame (iPhone proportions), scaled as one unit to fit the viewport. */
export function PhoneFrame({ children, scale }: { children: ReactNode; scale: number }) {
  return (
    <div
      className="relative shrink-0"
      style={{ width: FRAME_WIDTH * scale, height: FRAME_HEIGHT * scale }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: FRAME_WIDTH, height: FRAME_HEIGHT, transform: `scale(${scale})` }}
      >
        <span
          aria-hidden
          className="absolute -left-[3px] top-[140px] h-8 w-[4px] rounded-l-md bg-[#262a33]"
        />
        <span
          aria-hidden
          className="absolute -left-[3px] top-[196px] h-[58px] w-[4px] rounded-l-md bg-[#262a33]"
        />
        <span
          aria-hidden
          className="absolute -left-[3px] top-[266px] h-[58px] w-[4px] rounded-l-md bg-[#262a33]"
        />
        <span
          aria-hidden
          className="absolute -right-[3px] top-[220px] h-[92px] w-[4px] rounded-r-md bg-[#262a33]"
        />
        <div className="absolute inset-0 rounded-[64px] bg-[#2b2f38] p-[2px] shadow-[0_24px_64px_-24px_rgba(0,0,0,0.55)]">
          <div className="h-full w-full rounded-[62px] bg-[#07080b] p-[10px]">
            <div className="relative h-full w-full overflow-hidden rounded-[52px] bg-ink-900 [transform:translateZ(0)]">
              {children}
              <span
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-[11px] z-[100] h-[34px] w-[122px] -translate-x-1/2 rounded-full bg-black"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusIcons() {
  return (
    <span className="flex items-center gap-[7px]" dir="ltr">
      <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
        <rect x="0" y="8" width="3" height="4" rx="1" />
        <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
        <rect x="10" y="3" width="3" height="9" rx="1" />
        <rect x="15" y="0" width="3" height="12" rx="1" />
      </svg>
      <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
        <path d="M8 2.6c2.3 0 4.4.9 6 2.4l1.1-1.2A10.4 10.4 0 0 0 8 1 10.4 10.4 0 0 0 .9 3.8L2 5a8.7 8.7 0 0 1 6-2.4zm0 3.3c1.4 0 2.7.5 3.7 1.4l1.1-1.2A7.2 7.2 0 0 0 8 4.3a7.2 7.2 0 0 0-4.8 1.8l1.1 1.2c1-.9 2.3-1.4 3.7-1.4zm0 3.2c.6 0 1.1.2 1.5.6L8 11.3 6.5 9.7c.4-.4.9-.6 1.5-.6z" />
      </svg>
      <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
        <rect
          x="0.5"
          y="0.5"
          width="23"
          height="12"
          rx="3.5"
          stroke="currentColor"
          strokeOpacity="0.4"
        />
        <rect x="2" y="2" width="20" height="9" rx="2.2" fill="currentColor" />
        <path
          d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z"
          fill="currentColor"
          fillOpacity="0.45"
        />
      </svg>
    </span>
  );
}

/** iOS-style status bar for the framed preview; it mirrors in right-to-left layouts, as iOS does. */
export function StatusBar() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-[95] flex h-[50px] items-center justify-between pe-[28px] ps-[38px] pt-[5px] text-white"
    >
      <span dir="ltr" className="text-[16px] font-semibold tracking-[-0.02em]">
        9:41
      </span>
      <StatusIcons />
    </div>
  );
}

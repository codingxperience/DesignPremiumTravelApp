import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  Globe2,
  LayoutGrid,
  Mail,
  MapPin,
  MousePointerClick,
  Phone,
  Route,
} from "lucide-react";
import { LogoLockup, LogoMark } from "@/brand/Logo";
import { CONTACT } from "@/data/demo";
import { cn } from "@/lib/cn";
import { translate, type Lang } from "@/lib/i18n";
import type { NavStyle } from "@/state/routes";
import { buildScenario, currentScreenId, SCREEN_GROUPS, type ScreenId } from "@/state/scenarios";
import { useAppState, useDispatch } from "@/state/store";
import { Segmented } from "@/ui/Controls";
import { EASE_OUT } from "@/ui/motion";
import { AppShell } from "./AppShell";
import { FRAME_HEIGHT, FRAME_WIDTH, PhoneFrame } from "./PhoneFrame";

const NAV_STYLES: NavStyle[] = ["orbit", "capsule", "ticket"];
const WIDE = 1240;
const DEVICE = 640;

function useViewport() {
  const [size, setSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}

function useShowcaseActions() {
  const dispatch = useDispatch();
  return {
    jump: (id: ScreenId) => {
      dispatch({ type: "JUMP", scenario: buildScenario(id) });
      const url = new URL(window.location.href);
      url.searchParams.set("screen", id);
      window.history.replaceState(null, "", url);
    },
    setNav: (navStyle: NavStyle) => dispatch({ type: "SET_NAV_STYLE", navStyle }),
    setLang: (lang: Lang) => dispatch({ type: "SET_LANG", lang }),
  };
}

/** Miniature drawings of each navigation concept. */
function NavPreview({ style, active }: { style: NavStyle; active: boolean }) {
  const accent = active ? "bg-brand-orange" : "bg-white/45";
  if (style === "orbit") {
    return (
      <div className="relative h-11 w-[104px]">
        <div className="absolute inset-x-0 bottom-0 flex h-8 items-center justify-between rounded-full border border-white/15 bg-white/[0.07] px-3">
          <span className="size-1.5 rounded-full bg-white/70" />
          <span className="size-1.5 rounded-full bg-white/35" />
          <span className="w-5" />
          <span className="size-1.5 rounded-full bg-white/35" />
          <span className="size-1.5 rounded-full bg-white/35" />
        </div>
        <span
          className={cn(
            "absolute left-1/2 top-0 size-6 -translate-x-1/2 rounded-full ring-4 ring-ink-900",
            accent,
          )}
        />
      </div>
    );
  }
  if (style === "capsule") {
    return (
      <div className="flex h-11 w-[104px] items-end gap-1.5">
        <div className="flex h-8 flex-1 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.07] px-1">
          <span className="h-6 w-8 rounded-full bg-white/85" />
          <span className="size-1.5 rounded-full bg-white/35" />
          <span className="size-1.5 rounded-full bg-white/35" />
          <span className="size-1.5 rounded-full bg-white/35" />
        </div>
        <span className={cn("size-8 rounded-full", accent)} />
      </div>
    );
  }
  return (
    <div className="flex h-11 w-[104px] items-end">
      <div className="relative flex h-8 w-full overflow-hidden rounded-[9px] border border-white/15 bg-white/[0.07]">
        <div className="flex flex-1 items-center justify-around px-1.5">
          <span className="size-1.5 rounded-full bg-white/70" />
          <span className="size-1.5 rounded-full bg-white/35" />
          <span className="size-1.5 rounded-full bg-white/35" />
        </div>
        <span className="my-1.5 border-s border-dashed border-white/30" />
        <span className={cn("w-7", accent)} />
        <span className="absolute -top-1.5 right-[22px] size-3 rounded-full bg-ink-950" />
        <span className="absolute -bottom-1.5 right-[22px] size-3 rounded-full bg-ink-950" />
      </div>
    </div>
  );
}

function NavConcepts({ compact }: { compact?: boolean }) {
  const { navStyle } = useAppState();
  const { setNav } = useShowcaseActions();
  return (
    <div
      role="radiogroup"
      aria-label="Bottom navigation concept"
      className={cn(compact ? "grid grid-cols-3 gap-2" : "space-y-2.5")}
    >
      {NAV_STYLES.map((style, index) => {
        const active = navStyle === style;
        return (
          <button
            key={style}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setNav(style)}
            className={cn(
              "group flex w-full items-center gap-4 rounded-[20px] border text-start transition-colors duration-300",
              compact ? "flex-col items-start gap-2 p-3" : "p-3.5",
              active
                ? "border-brand-orange/60 bg-brand-orange/[0.08]"
                : "border-white/[0.08] bg-white/[0.025] hover:border-white/15 hover:bg-white/[0.05]",
            )}
          >
            <NavPreview style={style} active={active} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-[14px] font-semibold">
                <span className="text-[11px] font-bold tabular-nums text-fg-subtle">
                  0{index + 1}
                </span>
                {translate("en", `nav.style.${style}`)}
                {active && <Check className="size-4 text-brand-orange" strokeWidth={3} />}
              </span>
              {!compact && (
                <span className="mt-1 block text-[12.5px] leading-snug text-fg-muted">
                  {translate("en", `nav.style.${style}.desc`)}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function LanguageSwitch({ className }: { className?: string }) {
  const { lang } = useAppState();
  const { setLang } = useShowcaseActions();
  return (
    <Segmented
      className={className}
      direction="ltr"
      label="App language"
      value={lang}
      onChange={setLang}
      options={[
        { value: "en", label: "English" },
        { value: "ar", label: <span lang="ar">العربية</span> },
      ]}
    />
  );
}

function ScreenIndex({ onPick }: { onPick?: () => void }) {
  const state = useAppState();
  const { jump } = useShowcaseActions();
  const current = currentScreenId(state);
  return (
    <div className="space-y-4">
      {SCREEN_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-fg-subtle">
            {group.title}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {group.screens.map((screen) => (
              <button
                key={screen.id}
                type="button"
                onClick={() => {
                  jump(screen.id);
                  onPick?.();
                }}
                aria-current={current === screen.id ? "page" : undefined}
                className={cn(
                  "h-8 rounded-full border px-3 text-[12.5px] font-medium transition-colors duration-200",
                  current === screen.id
                    ? "border-brand-orange bg-brand-orange text-ink-950"
                    : "border-white/[0.09] bg-white/[0.03] text-fg-muted hover:border-white/20 hover:text-fg",
                )}
              >
                {screen.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PanelHeading({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div>
      <p className="overline text-orange-300">{kicker}</p>
      <h2 className="heading mt-2.5 text-[22px] leading-tight">{title}</h2>
      {children && <p className="mt-2 text-[13.5px] leading-relaxed text-fg-muted">{children}</p>}
    </div>
  );
}

function IntroPanel() {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.2 }}
      className="no-scrollbar max-h-full w-full max-w-[360px] justify-self-end overflow-y-auto py-10"
    >
      <LogoLockup className="w-[136px]" />
      <p className="overline mt-10 text-orange-300">Mobile app prototype · v1.0</p>
      <h1 className="heading mt-4 text-[44px] leading-[1.02]">Your journey, our priority.</h1>
      <p className="mt-3 text-[22px] font-bold text-orange-300/80" lang="ar" dir="rtl">
        رحلتك، أولويتنا
      </p>
      <p className="mt-5 text-[14.5px] leading-relaxed text-fg-muted">
        A bilingual travel companion for Cross World Travel and Tourism: flights, hotels, holidays,
        Umrah &amp; Hajj, visas and Egypt security approvals, designed for travellers in the UK and
        beyond.
      </p>
      <div className="mt-9 border-t border-white/[0.07] pt-7">
        <p className="mb-4 flex items-center gap-2 text-[13px] font-semibold">
          <MousePointerClick className="size-4 text-orange-300" />
          Jump to any screen
        </p>
        <ScreenIndex />
      </div>
    </motion.aside>
  );
}

function ControlsPanel() {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.3 }}
      className="no-scrollbar max-h-full w-full max-w-[340px] justify-self-start overflow-y-auto py-10"
    >
      <PanelHeading kicker="Bottom navigation · 3 concepts" title="Choose how travellers move.">
        Switch live; the whole prototype updates instantly. Each concept opens the same six Cross
        World services.
      </PanelHeading>
      <div className="mt-5">
        <NavConcepts />
      </div>

      <div className="mt-9">
        <PanelHeading kicker="Language" title="English & العربية">
          Full right-to-left layout, Arabic typography and translated content.
        </PanelHeading>
        <LanguageSwitch className="mt-4" />
      </div>

      <section
        aria-labelledby="prototype-guide-title"
        className="mt-9 rounded-[22px] border border-white/[0.07] bg-white/[0.025] p-4"
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/10 text-orange-300"
          >
            <Route className="size-[18px] stroke-[1.5]" />
          </span>
          <h3 id="prototype-guide-title" className="text-[14px] font-semibold">
            Try this
          </h3>
        </div>
        <ul className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-fg-muted">
          <li>Tap the globe in the Orbit dock to launch services.</li>
          <li>Book London → Cairo and pick seat 22A.</li>
          <li>Message the concierge in English or Arabic.</li>
          <li>Apply for an Egypt security approval and track it.</li>
        </ul>
      </section>

      <div className="mt-6 space-y-2 text-[12.5px] text-fg-subtle">
        <p className="flex items-center gap-2">
          <MapPin className="size-3.5" /> London, England · Company No. 16634218
        </p>
        <a
          href={CONTACT.emailHref}
          className="flex items-center gap-2 transition-colors hover:text-fg"
        >
          <Mail className="size-3.5" /> {CONTACT.email}
        </a>
        <a
          href={CONTACT.phoneHref}
          className="flex items-center gap-2 transition-colors hover:text-fg"
        >
          <Phone className="size-3.5" /> {CONTACT.phone}
        </a>
      </div>
    </motion.aside>
  );
}

function CompactToolbar() {
  const [open, setOpen] = useState<"screens" | "nav" | null>(null);
  const { navStyle } = useAppState();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(null);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(null);
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggleButton = (id: "screens" | "nav", icon: ReactNode, label: string) => (
    <button
      type="button"
      onClick={() => setOpen(open === id ? null : id)}
      aria-expanded={open === id}
      className={cn(
        "flex h-10 items-center gap-2 rounded-full border px-3.5 text-[13px] font-semibold transition-colors",
        open === id
          ? "border-brand-orange/60 bg-brand-orange/10"
          : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]",
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      <ChevronDown
        className={cn("size-4 text-fg-subtle transition-transform", open === id && "rotate-180")}
      />
    </button>
  );

  return (
    <div
      ref={ref}
      className="relative z-10 flex h-[72px] shrink-0 items-center justify-between gap-3 px-5"
    >
      <div className="flex min-w-0 items-center gap-3">
        <LogoMark className="h-7 w-auto shrink-0" title="Cross World Travel and Tourism" />
        <div className="hidden min-w-0 md:block">
          <p className="truncate text-[14px] font-semibold">Cross World</p>
          <p className="truncate text-[11.5px] text-fg-subtle">Mobile app prototype</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {toggleButton(
          "nav",
          <LayoutGrid className="size-4 text-orange-300" />,
          translate("en", `nav.style.${navStyle}`),
        )}
        {toggleButton("screens", <Globe2 className="size-4 text-orange-300" />, "Screens")}
        <LanguageSwitch className="w-[178px]" />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="glass no-scrollbar absolute end-5 top-[64px] max-h-[min(70vh,560px)] w-[min(420px,calc(100vw-40px))] overflow-y-auto rounded-[24px] p-4 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.85)]"
          >
            {open === "screens" ? <ScreenIndex onPick={() => setOpen(null)} /> : <NavConcepts />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Presents the app in a device frame on larger screens and full-bleed on phones. */
export function Showcase() {
  const { width, height } = useViewport();

  if (width < DEVICE) {
    return (
      <div className="h-dvh w-full overflow-hidden bg-ink-900">
        <AppShell mode="device" />
      </div>
    );
  }

  const wide = width >= WIDE;
  const reserved = wide ? 48 : 72 + 24;
  const scale = Math.max(
    0.5,
    Math.min(1, (height - reserved) / FRAME_HEIGHT, (width - 32) / FRAME_WIDTH),
  );

  return (
    <div data-prototype-stage className="relative h-dvh w-full overflow-hidden bg-ink-950 text-fg">
      {wide ? (
        <div className="relative mx-auto grid h-full max-w-[1500px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-14 px-14">
          <IntroPanel />
          <PhoneFrame scale={scale}>
            <AppShell mode="frame" />
          </PhoneFrame>
          <ControlsPanel />
        </div>
      ) : (
        <div className="relative flex h-full flex-col">
          <CompactToolbar />
          <div className="flex min-h-0 flex-1 items-start justify-center px-4 pb-6">
            <PhoneFrame scale={scale}>
              <AppShell mode="frame" />
            </PhoneFrame>
          </div>
        </div>
      )}
    </div>
  );
}

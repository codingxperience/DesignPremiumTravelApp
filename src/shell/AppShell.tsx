import { AnimatePresence, motion } from "motion/react";
import { useEffect, type CSSProperties } from "react";
import { AuthFlow } from "@/screens/welcome/Auth";
import { OnboardingScreen } from "@/screens/welcome/Onboarding";
import { SplashScreen } from "@/screens/welcome/Splash";
import { useAppState, useI18n } from "@/state/store";
import { OverlayRoot } from "@/ui/Overlay";
import { ToastHost } from "@/ui/Toast";
import { Navigator } from "./Navigator";
import { StatusBar } from "./PhoneFrame";

const FRAME_INSETS = { "--sat": "50px", "--sab": "26px" } as CSSProperties;
const DEVICE_INSETS = {
  "--sat": "max(env(safe-area-inset-top), 12px)",
  "--sab": "max(env(safe-area-inset-bottom), 10px)",
} as CSSProperties;

function Phase() {
  const { phase } = useAppState();
  switch (phase) {
    case "splash":
      return <SplashScreen />;
    case "onboarding":
      return <OnboardingScreen />;
    case "auth":
      return <AuthFlow />;
    case "app":
      return <Navigator />;
  }
}

/**
 * The app itself. `frame` renders inside the presentation phone (with a
 * simulated status bar); `device` fills a real phone screen and respects its
 * safe areas.
 */
export function AppShell({ mode }: { mode: "frame" | "device" }) {
  const { phase } = useAppState();
  const { lang, dir } = useI18n();

  useEffect(() => {
    if (mode !== "device") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [mode, lang, dir]);

  return (
    <div
      dir={dir}
      lang={lang}
      className="relative isolate h-full w-full overflow-hidden bg-ink-900 text-fg"
      style={mode === "frame" ? FRAME_INSETS : DEVICE_INSETS}
    >
      <OverlayRoot>
        <AnimatePresence initial={false}>
          <motion.div
            key={phase}
            className="absolute inset-0"
            initial={phase === "splash" ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
          >
            <Phase />
          </motion.div>
        </AnimatePresence>
        <ToastHost />
      </OverlayRoot>
      {mode === "frame" && phase !== "splash" && <StatusBar />}
      {mode === "frame" && phase !== "splash" && (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-2 left-1/2 z-[95] h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-white/85"
        />
      )}
    </div>
  );
}

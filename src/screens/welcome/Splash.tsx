import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useI18n } from "@/state/store";

export const SPLASH_DURATION_MS = 4000;

const ASSET_ROOT = `${import.meta.env.BASE_URL}brand/splash/`;

/**
 * The opening four seconds of the supplied film, with its generic title
 * replaced by the official Cross World lockup. Playback—not a separate
 * animation timer—controls the handoff so the aircraft reveal isn't cut short.
 */
export function SplashScreen() {
  const dispatch = useDispatch();
  const { t } = useI18n();
  const reducedMotion = useReducedMotion();
  const [playbackFailed, setPlaybackFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const completed = useRef(false);
  const enteredAt = useRef(performance.now());
  const staticMode = Boolean(reducedMotion) || playbackFailed;

  const complete = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    dispatch({ type: "SET_PHASE", phase: "onboarding" });
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;
    let playbackGuard: number | undefined;
    const remaining = Math.max(0, SPLASH_DURATION_MS - (performance.now() - enteredAt.current));

    // A static brand card remains usable when motion is reduced, autoplay is
    // blocked, or the media cannot load. It never traps the traveller.
    const fallbackDeadline = window.setTimeout(complete, remaining);
    if (staticMode) return () => window.clearTimeout(fallbackDeadline);

    const video = videoRef.current;
    if (!video) return () => window.clearTimeout(fallbackDeadline);

    const startupGuard = window.setTimeout(() => setPlaybackFailed(true), 1500);
    const onPlaying = () => {
      window.clearTimeout(startupGuard);
      window.clearTimeout(fallbackDeadline);
      // Normally `ended` completes at exactly 4 seconds. This only covers a
      // stalled decoder that never emits `ended`.
      playbackGuard = window.setTimeout(complete, SPLASH_DURATION_MS + 750);
    };
    video.addEventListener("playing", onPlaying, { once: true });
    video.play().catch(() => {
      if (!cancelled) setPlaybackFailed(true);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(startupGuard);
      window.clearTimeout(fallbackDeadline);
      window.clearTimeout(playbackGuard);
      video.removeEventListener("playing", onPlaying);
      video.pause();
    };
  }, [complete, staticMode]);

  return (
    <section
      aria-label={t("splash.loading")}
      aria-busy="true"
      data-splash-mode={staticMode ? "static" : "video"}
      className="absolute inset-0 isolate overflow-hidden bg-[#020106]"
    >
      <h1 className="sr-only">{t("brand.full")}</h1>
      {staticMode ? (
        <img
          src={`${ASSET_ROOT}cross-world-still.webp`}
          alt=""
          aria-hidden="true"
          width={720}
          height={1280}
          draggable={false}
          className="absolute inset-0 size-full select-none object-cover"
        />
      ) : (
        <video
          ref={videoRef}
          src={`${ASSET_ROOT}cross-world-intro.mp4`}
          aria-hidden="true"
          width={720}
          height={1280}
          autoPlay
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          onEnded={complete}
          onError={() => setPlaybackFailed(true)}
          className="pointer-events-none absolute inset-0 size-full object-cover"
        />
      )}
      <button
        type="button"
        onClick={complete}
        className="sr-only focus:not-sr-only focus:absolute focus:end-5 focus:top-[calc(var(--sat)+12px)] focus:rounded-full focus:bg-brand-orange focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink-950"
      >
        {t("onb.skip")}
      </button>
    </section>
  );
}

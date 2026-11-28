import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { api, type Session } from "./api";

const attemptKey = "travel-google-attempt";
const returnKey = "travel-google-return";
const valuePattern = /^[A-Za-z0-9_-]{43}$/;
const attemptLifetime = 10 * 60 * 1000;

function urlSafe(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function startGoogle() {
  if (!Capacitor.isNativePlatform()) {
    sessionStorage.setItem(returnKey, JSON.stringify({ hash: location.hash, state: history.state }));
    location.assign("/auth/google/start");
    return;
  }
  const origin = import.meta.env.VITE_TRAVEL_ORIGIN;
  if (!origin) throw new Error("The agency server address is missing from this build.");
  const verifier = urlSafe(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = urlSafe(new Uint8Array(digest));
  localStorage.setItem(attemptKey, JSON.stringify({ verifier, until: Date.now() + attemptLifetime }));
  const start = new URL("/auth/google/start", origin);
  start.searchParams.set("device", challenge);
  try {
    await Browser.open({ url: start.href });
  } catch (error) {
    localStorage.removeItem(attemptKey);
    throw error;
  }
}

export function googleReturnView(hash: string) {
  const page = hash.replace(/^#/, "").split("?")[0];
  return !page || page === "signup" || page === "account" || page === "onboarding" ? "#home" : hash;
}

export function restoreGoogleReturn() {
  if (location.hash !== "#account?google=done") return;
  const saved = sessionStorage.getItem(returnKey);
  sessionStorage.removeItem(returnKey);
  try {
    const target = saved && JSON.parse(saved);
    if (typeof target?.hash === "string" && target.hash.startsWith("#")) {
      history.replaceState(target.state, "", googleReturnView(target.hash));
      return;
    }
  } catch {
    // Use the home screen when the previous page is unavailable.
  }
  history.replaceState(null, "", "#home");
}

export function listenForGoogle(
  onSession: (session: Session) => void,
  onError: (error: unknown) => void,
) {
  if (!Capacitor.isNativePlatform()) return;
  let listening = true;

  async function receive(raw: string) {
    if (!listening) return;
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      return;
    }
    if (
      url.protocol !== "com.crossworldtravelagency.travel:" ||
      url.host !== "auth" ||
      url.pathname !== "/google" ||
      url.username ||
      url.password
    ) return;
    const code = url.searchParams.get("code");
    const saved = localStorage.getItem(attemptKey);
    if (!code || !valuePattern.test(code) || !saved) return;

    // Claim the pending attempt before awaiting so a cold-launch URL and a
    // listener event cannot exchange the same code twice.
    localStorage.removeItem(attemptKey);
    try {
      const { verifier, until } = JSON.parse(saved);
      if (typeof verifier !== "string" || !valuePattern.test(verifier) || !Number.isFinite(until) || Date.now() > until) {
        throw new Error("The Google sign-in attempt expired.");
      }
      const session = await api<Session>("google/exchange", { code, verifier });
      if (listening) onSession(session);
    } catch (error) {
      if (listening) onError(error);
    } finally {
      void Browser.close().catch(() => {});
    }
  }

  const listener = App.addListener("appUrlOpen", ({ url }) => void receive(url));
  void listener
    .then(() => App.getLaunchUrl())
    .then((launch) => { if (launch?.url) void receive(launch.url); })
    .catch((error) => { if (listening) onError(error); });
  return () => {
    listening = false;
    void listener.then((handle) => handle.remove()).catch(() => {});
  };
}

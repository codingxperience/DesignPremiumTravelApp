import { Capacitor } from "@capacitor/core";

const native = Capacitor.isNativePlatform();
const origin = import.meta.env.VITE_TRAVEL_ORIGIN as string | undefined;
const base = native ? (origin || "") + "/mobile/" : "/api/";
let bearer = "";
let csrf = "";
export type Session = {
  email: string | null;
  csrf?: string;
  token?: string;
  inviteOnly?: boolean;
};
export type Service = "flight" | "hotel" | "holiday" | "visa" | "umrah" | "egypt" | "approval";
export type Trip = {
  id: string;
  destination: string;
  service: Service;
  departure: string;
  travellers: number;
  rooms?: number | null;
  preferredCurrency?: string;
  flightSearch?: Partial<import("@/screens/flights/JourneyResults").Journey>;
  created: string;
};
export type Detail = Trip & {
  confirmation: null | { supplier: string; reference: string; itinerary: string; created: string };
  attachmentRequested: boolean;
  attached: boolean;
  quote: null | {
    id: string;
    amount: string;
    currency: string;
    details: string;
    until: string;
    accepted: boolean;
    expired: boolean;
  };
  messages: { id: number; body: string; staff: boolean; created: string }[];
};
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
function responseMessage(status: number, message?: string) {
  if (document.documentElement.lang !== "ar")
    return message || "The travel desk could not complete this request. Please try again.";
  const translations: Record<string, string> = {
    "Check your email and password.": "تحقق من بريدك الإلكتروني وكلمة المرور.",
    "Check your current password.": "تحقق من كلمة المرور الحالية.",
    "Account email is unavailable during testing.":
      "خدمات البريد الإلكتروني للحساب غير متاحة أثناء الاختبار.",
    "This link has expired or has already been used.":
      "انتهت صلاحية الرابط أو سبق استخدامه. اطلب رابطاً جديداً.",
    "The quote has expired.": "انتهت صلاحية عرض السعر.",
    "The quote has changed. Refresh to see the current one.":
      "تغيّر عرض السعر. حدّث الملف للاطلاع على العرض الحالي.",
    "Choose a date in the next two years.": "اختر تاريخاً خلال السنتين المقبلتين.",
    "Choose a valid JPEG or PNG.": "اختر صورة JPEG أو PNG صالحة.",
    "Choose an image under 2 MB.": "اختر صورة أصغر من ٢ ميغابايت.",
  };
  if (message && translations[message]) return translations[message];
  if (status === 429) return "محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.";
  if (status === 401) return "سجّل الدخول للمتابعة.";
  if (status === 404) return "الطلب غير متاح.";
  if (status === 413) return "الملف أو الطلب أكبر من المسموح به.";
  return status === 400 ? "تحقق من البيانات وأعد المحاولة." : "تعذر إكمال الطلب. حاول مجدداً.";
}

export async function api<T>(route: string, data?: unknown): Promise<T> {
  if (native && !origin) throw new Error("The agency server address is missing from this build.");
  const headers: Record<string, string> = {};
  const form = data instanceof FormData;
  if (data !== undefined && !form) headers["Content-Type"] = "application/json";
  if (native && bearer) headers.Authorization = "Bearer " + bearer;
  if (!native && data !== undefined) {
    if (!csrf) await loadSession();
    headers["X-CSRFToken"] = csrf;
  }
  const response = await fetch(base + route, {
    method: data === undefined ? "GET" : "POST",
    headers,
    credentials: native ? "omit" : "same-origin",
    body: form ? data : data === undefined ? undefined : JSON.stringify(data),
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
    if (response.status === 401 && route !== "login") {
      clearSession();
      window.dispatchEvent(new Event("travel-session-ended"));
    }
    throw new ApiError(responseMessage(response.status, result.error), response.status);
  }
  return result as T;
}
export function remember(session: Session) {
  csrf = session.csrf || "";
  bearer = session.token || "";
}
export function clearSession() {
  csrf = "";
  bearer = "";
}
export async function loadSession() {
  const s = await api<Session>("session");
  if (!native) csrf = s.csrf || "";
  return s;
}

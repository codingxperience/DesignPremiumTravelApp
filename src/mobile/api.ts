import { Capacitor } from "@capacitor/core";

const native = Capacitor.isNativePlatform();
const origin = import.meta.env.VITE_TRAVEL_ORIGIN as string | undefined;
const base = native ? (origin || "") + "/mobile/" : "/api/";
let bearer = "";
let csrf = "";
export type Session = {
  email: string | null;
  fullName?: string | null;
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
  const arabic = document.documentElement.lang === "ar";
  if (status === 0) {
    return arabic
      ? "تعذّر الاتصال بخدمة السفر. تحقّق من اتصالك بالإنترنت ثم حاول مجدداً."
      : "We couldn’t connect to the travel service. Check your internet connection and try again.";
  }
  if (status >= 500 && !message) {
    return arabic
      ? "خدمة السفر غير متاحة مؤقتاً. حاول مجدداً بعد بضع دقائق."
      : "The travel service is temporarily unavailable. Try again in a few minutes.";
  }
  if (!arabic)
    return message || "The travel desk could not complete this request. Please try again.";
  const translations: Record<string, string> = {
    "Enter a valid email address.": "أدخل عنوان بريد إلكتروني صالحاً.",
    "Enter your full name.": "أدخل اسمك الكامل.",
    "Enter a valid mobile number with its country calling code.": "أدخل رقم جوال صالحاً مع رمز الاتصال الدولي.",
    "Accept the Terms of Service and Privacy Policy to continue.": "وافق على شروط الخدمة وسياسة الخصوصية للمتابعة.",
    "Enter the 32-character invite code from the travel desk.": "أدخل رمز الدعوة المكوّن من ٣٢ حرفاً من مكتب السفر.",
    "That invite could not be used. Check the email and code or ask the travel desk for a new invite.":
      "تعذّر استخدام الدعوة. تحقّق من البريد الإلكتروني والرمز أو اطلب دعوة جديدة من مكتب السفر.",
    "Use the email link to create your account.": "استخدم رابط البريد الإلكتروني لإنشاء حسابك.",
    "Password must be at most 256 characters.": "يجب ألّا تتجاوز كلمة المرور ٢٥٦ حرفاً.",
    "Use at least 12 characters for your password.": "استخدم ١٢ حرفاً على الأقل في كلمة المرور.",
    "Choose a less common password.": "اختر كلمة مرور أقل شيوعاً.",
    "Add letters to your password so it is not all numbers.": "أضف حروفاً إلى كلمة المرور لتجنب استخدام الأرقام فقط.",
    "Choose a password that is different from your email address.": "اختر كلمة مرور مختلفة عن عنوان بريدك الإلكتروني.",
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
  let response: Response;
  try {
    response = await fetch(base + route, {
      method: data === undefined ? "GET" : "POST",
      headers,
      credentials: native ? "omit" : "same-origin",
      body: form ? data : data === undefined ? undefined : JSON.stringify(data),
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new ApiError(responseMessage(0), 0);
  }
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

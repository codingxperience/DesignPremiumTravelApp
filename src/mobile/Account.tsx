import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { TextField } from "@/ui/Field";
import { useState, type FormEvent } from "react";
import { api, clearSession, remember, type Session } from "./api";
import { useText } from "./ui";

type Mode = "login" | "register" | "reset" | "setup";
export function Account({
  email,
  onSession,
  token,
  deleting,
  onDone,
}: {
  email: string | null;
  onSession: (email: string | null) => void;
  token: string;
  deleting: boolean;
  onDone: () => void;
}) {
  const t = useText();
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<Mode>(token ? "setup" : "login");
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  const change = (value: Mode) => {
    setMode(value);
    setVisible(false);
    setError("");
    setNotice("");
  };
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget,
      data = new FormData(form),
      address = String(data.get("email") || ""),
      password = String(data.get("password") || "");
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (email) {
        await api(deleting ? "delete" : "logout", deleting ? { password } : {});
        clearSession();
        onSession(null);
        onDone();
      } else if (mode === "login") {
        const session = await api<Session>("login", { email: address, password });
        remember(session);
        onSession(session.email);
        if (!deleting) onDone();
      } else if (mode === "setup") {
        await api("password", { token, password });
        change("login");
        form.reset();
        setNotice(
          t(
            "Your password is ready. You can now sign in.",
            "تم حفظ كلمة المرور. يمكنك تسجيل الدخول الآن.",
          ),
        );
      } else {
        await api("email", { email: address, purpose: mode });
        setNotice(
          t(
            "If this address is eligible, an email will arrive with a link valid for 30 minutes.",
            "إذا كان العنوان مؤهلاً، ستصلك رسالة برابط صالح لمدة ٣٠ دقيقة.",
          ),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Please try again.", "حاول مجدداً."));
    } finally {
      setBusy(false);
    }
  }
  const title = email
    ? deleting
      ? t("Delete your account", "حذف حسابك")
      : t("Your account", "حسابك")
    : mode === "setup"
      ? t("Choose a password", "اختر كلمة مرور")
      : mode === "register"
        ? t("Create an account", "إنشاء حساب")
        : mode === "reset"
          ? t("Reset your password", "استعادة كلمة المرور")
          : t("Sign in", "تسجيل الدخول");
  return (
    <section className="panel account">
      <h1>{title}</h1>
      {!email && mode === "login" && (
        <p>
          {t(
            "Sign in to manage your bookings, visas and trips.",
            "سجّل الدخول لإدارة حجوزاتك وتأشيراتك ورحلاتك.",
          )}
        </p>
      )}
      {deleting && (
        <p>
          {t(
            "Deletion permanently removes your travel requests, quotes, messages and submitted photos. Sign in and confirm with your current password.",
            "يؤدي الحذف إلى إزالة طلبات السفر وعروض الأسعار والرسائل والصور المرسلة نهائياً. سجّل الدخول ثم أكّد بكلمة مرورك الحالية.",
          )}
        </p>
      )}
      {email && <p dir="auto">{email}</p>}
      <form onSubmit={submit} key={String(!!email) + mode}>
        {!email && mode !== "setup" && (
          <TextField
            label={t("Email address", "البريد الإلكتروني")}
            icon={<Mail />}
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={150}
            ltr
          />
        )}
        {(email ? deleting : mode === "login" || mode === "setup") && (
          <TextField
            label={t("Password", "كلمة المرور")}
            icon={<LockKeyhole />}
            name="password"
            type={visible ? "text" : "password"}
            autoComplete={mode === "setup" ? "new-password" : "current-password"}
            minLength={mode === "setup" ? 12 : 1}
            maxLength={256}
            required
            hint={
              mode === "setup"
                ? t("Use at least 12 characters.", "استخدم ١٢ حرفاً على الأقل.")
                : undefined
            }
            trailing={
              <button
                type="button"
                aria-label={
                  visible
                    ? t("Hide password", "إخفاء كلمة المرور")
                    : t("Show password", "إظهار كلمة المرور")
                }
                onClick={() => setVisible((v) => !v)}
                className="grid size-9 place-items-center text-fg-subtle"
              >
                {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            }
          />
        )}
        <button className={email && deleting ? "danger" : "primary"} disabled={busy}>
          {busy
            ? t("Please wait…", "يرجى الانتظار…")
            : email
              ? deleting
                ? title
                : t("Sign out", "تسجيل الخروج")
              : mode === "login"
                ? title
                : mode === "setup"
                  ? t("Save password", "حفظ كلمة المرور")
                  : t("Send email link", "إرسال الرابط")}
        </button>
      </form>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      {!email && (
        <div className="links">
          {mode !== "login" && (
            <button onClick={() => change("login")}>{t("Sign in", "تسجيل الدخول")}</button>
          )}
          {mode === "login" && (
            <>
              <button onClick={() => change("register")}>
                {t("Create an account", "إنشاء حساب")}
              </button>
              <button onClick={() => change("reset")}>
                {t("Forgot password?", "نسيت كلمة المرور؟")}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

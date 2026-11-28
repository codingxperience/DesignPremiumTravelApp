import { useState, type FormEvent } from "react";
import { KeyRound, LockKeyhole, Mail, UserRound } from "lucide-react";
import { GoogleIcon } from "@/ui/Icons";
import { startGoogle } from "./google";
import { CONTACT } from "@/data/demo";
import { AuthLayout, OrDivider, PasswordToggle, SocialButtons } from "@/screens/welcome/Auth";
import { useI18n } from "@/state/store";
import { Button } from "@/ui/Button";
import { TextField } from "@/ui/Field";
import { InternationalPhone } from "@/ui/InternationalPhone";
import { api, ApiError, clearSession, remember, type Session } from "./api";
import { useText } from "./ui";

type Mode = "login" | "register" | "invite" | "reset" | "setup";
type Registration = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  acceptedTerms: true;
};

export function Account({
  email,
  onSession,
  token,
  inviteOnly,
  googleSignIn,
  googleFailed,
  passwordless,
  deleting,
  onDone,
  onBack,
  startWithSignup,
  toggleLang,
  remove,
}: {
  email: string | null;
  onSession: (session: Session) => void;
  token: string;
  inviteOnly: boolean;
  googleSignIn: boolean;
  googleFailed: boolean;
  passwordless: boolean;
  deleting: boolean;
  onDone: () => void;
  onBack: () => void;
  startWithSignup: boolean;
  toggleLang: () => void;
  remove: () => void;
}) {
  const t = useText();
  const { t: copy, lang } = useI18n();
  const [mode, setMode] = useState<Mode>(token ? "setup" : startWithSignup ? "register" : "login");
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const googleError = t(
    "Google sign-in didn’t finish. Try again.",
    "لم يكتمل تسجيل الدخول عبر Google. حاول مجدداً.",
  );
  const [error, setError] = useState(googleFailed ? googleError : "");
  const [googleBusy, setGoogleBusy] = useState(false);
  const registering = !email && mode === "register" && inviteOnly;
  const passwordSetup = registering || mode === "setup";
  const origin = import.meta.env.VITE_TRAVEL_ORIGIN || window.location.origin;

  function change(next: Mode) {
    if (next !== "invite" && next !== "register") setRegistration(null);
    setVisible(false);
    setError("");
    setNotice("");
    setMode(next);
  }

  async function continueWithGoogle() {
    if (busy || googleBusy) return;
    setError("");
    setGoogleBusy(true);
    try {
      await startGoogle();
    } catch {
      setError(googleError);
    } finally {
      setGoogleBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const address = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    setError("");
    setNotice("");

    if (registering) {
      const fullName = String(data.get("fullName") || "").trim();
      const phone = String(data.get("phone") || "");
      if (fullName.length < 2) return setError(copy("auth.nameError"));
      if (!phone) return setError(copy("auth.phoneError"));
      if (!data.has("acceptedTerms")) return setError(copy("auth.termsError"));
      setRegistration({ fullName, email: address, phone, password, acceptedTerms: true });
      change("invite");
      return;
    }

    setBusy(true);
    try {
      if (email) {
        await api(
          deleting ? "delete" : "logout",
          deleting ? (passwordless ? { confirm: true } : { password }) : {},
        );
        clearSession();
        onSession({ email: null });
        onDone();
      } else if (mode === "login" || (mode === "invite" && registration)) {
        const session =
          mode === "invite"
            ? await api<Session>("activate", {
                ...registration,
                code: String(data.get("code") || "").trim(),
              })
            : await api<Session>("login", { email: address, password });
        setRegistration(null);
        remember(session);
        onSession(session);
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
      } else if (mode === "register" || mode === "reset") {
        await api("email", { email: address, purpose: mode });
        setNotice(
          t(
            "If this address is eligible, an email will arrive with a link valid for 30 minutes.",
            "إذا كان العنوان مؤهلاً، ستصلك رسالة برابط صالح لمدة ٣٠ دقيقة.",
          ),
        );
      }
    } catch (failure) {
      if (email && deleting && passwordless && failure instanceof ApiError && failure.status === 403) {
        setError(t(
          "Sign out, then sign in with Google and return here to delete your account.",
          "سجّل الخروج ثم ادخل عبر Google وارجع إلى هنا لحذف حسابك.",
        ));
      } else if (!email && mode === "login" && failure instanceof ApiError && failure.status === 401) {
        setError(
          t(
            "Sign-in failed. Check your email and password. If you’re new, choose Create account below.",
            "تعذّر تسجيل الدخول. تحقّق من بريدك الإلكتروني وكلمة المرور. إذا كنت مستخدماً جديداً، اختر إنشاء حساب أدناه.",
          ),
        );
      } else {
        setError(
          failure instanceof Error ? failure.message : t("Please try again.", "حاول مجدداً."),
        );
      }
    } finally {
      setBusy(false);
    }
  }

  const title = email
    ? deleting
      ? t("Delete your account", "حذف حسابك")
      : t("Your account", "حسابك")
    : mode === "login"
      ? copy("auth.welcome")
      : mode === "register"
        ? copy("auth.createTitle")
        : mode === "invite"
          ? t("Enter your invite code", "أدخل رمز الدعوة")
          : mode === "reset"
            ? t("Reset your password", "استعادة كلمة المرور")
            : t("Choose a password", "اختر كلمة مرور");

  const subtitle = email
    ? deleting
      ? passwordless
        ? t(
            "Delete your account and travel data permanently.",
            "سيُحذف حسابك وبيانات سفرك نهائياً.",
          )
        : t(
            "Confirm your password to permanently remove your account and travel data.",
            "أكّد كلمة مرورك لإزالة حسابك وبيانات سفرك نهائياً.",
          )
      : email
    : mode === "login"
      ? copy("auth.signinSub")
      : mode === "register"
        ? copy("auth.createSub")
        : mode === "invite"
          ? t(
              "Use the code the travel desk issued for your email.",
              "استخدم الرمز الذي أصدره مكتب السفر لبريدك الإلكتروني.",
            )
          : mode === "reset"
            ? t(
                "Enter your account email to request a reset link.",
                "أدخل بريد حسابك لطلب رابط إعادة التعيين.",
              )
            : t("Use at least 12 characters.", "استخدم ١٢ حرفاً على الأقل.");

  const mainButton = email
    ? deleting
      ? title
      : t("Sign out", "تسجيل الخروج")
    : mode === "login"
      ? copy("auth.signin")
      : mode === "register" || mode === "invite"
        ? copy("auth.createAccount")
        : mode === "setup"
          ? t("Save password", "حفظ كلمة المرور")
          : t("Send email link", "إرسال الرابط");

  const googleSignup = registering && googleSignIn;
  const googleAction = googleSignIn ? () => void continueWithGoogle() : undefined;

  return (
    <AuthLayout
      title={title}
      subtitle={subtitle}
      onBack={mode === "invite" ? () => change("register") : onBack}
      trailing={
        <button
          type="button"
          onClick={toggleLang}
          className="text-[13px] font-semibold text-orange-300"
        >
          {lang === "ar" ? "English" : "العربية"}
        </button>
      }
    >
      {googleSignup && (
        <div className="mb-7 space-y-3">
          <Button type="button" block variant="secondary" loading={googleBusy}
            icon={<GoogleIcon className="size-5" />} onClick={googleAction}>
            {t("Continue with Google", "المتابعة باستخدام Google")}
          </Button>
          <p className="text-center text-[13px] text-fg-muted">
            {t("Use Google to create your account without an invitation.", "أنشئ حسابك باستخدام Google من دون دعوة.")}
          </p>
          <p className="text-center text-xs text-fg-subtle">
            {t("By continuing, you agree to the", "بالمتابعة، فإنك توافق على")}{" "}
            <a href={origin + "/terms"} target="_blank" rel="noreferrer" className="text-orange-300">
              {t("Terms of Service", "شروط الخدمة")}
            </a>{" "}
            {t("and", "و")}{" "}
            <a href={origin + "/privacy"} target="_blank" rel="noreferrer" className="text-orange-300">
              {t("Privacy Policy", "سياسة الخصوصية")}
            </a>
            .
          </p>
          <OrDivider />
        </div>
      )}
      <form key={String(Boolean(email)) + mode} onSubmit={submit} className="space-y-4">
        {registering && (
          <TextField
            label={copy("auth.fullName")}
            icon={<UserRound />}
            name="fullName"
            autoComplete="name"
            defaultValue={registration?.fullName}
            placeholder="Ahmed Mohamed"
            minLength={2}
            maxLength={150}
            required
          />
        )}
        {!email && mode !== "setup" && mode !== "invite" && (
          <TextField
            label={copy("auth.email")}
            icon={<Mail />}
            name="email"
            type="email"
            autoComplete="username"
            autoCapitalize="none"
            inputMode="email"
            defaultValue={registration?.email}
            placeholder="name@email.com"
            required
            maxLength={150}
            ltr
          />
        )}
        {registering && <InternationalPhone required initialValue={registration?.phone} />}
        {mode === "invite" && !email && (
          <TextField
            label={t("Invite code", "رمز الدعوة")}
            icon={<KeyRound />}
            name="code"
            autoComplete="one-time-code"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={100}
            required
            ltr
          />
        )}
        {(email ? deleting && !passwordless : mode === "login" || passwordSetup) && (
          <TextField
            label={copy("auth.password")}
            icon={<LockKeyhole />}
            name="password"
            type={visible ? "text" : "password"}
            defaultValue={registering ? registration?.password : undefined}
            autoComplete={passwordSetup ? "new-password" : "current-password"}
            minLength={passwordSetup ? 12 : 1}
            maxLength={256}
            required
            ltr
            trailing={<PasswordToggle visible={visible} onToggle={() => setVisible(!visible)} />}
          />
        )}
        {!email && mode === "login" && (
          <div className="flex justify-end">
            {inviteOnly ? (
              <a href={CONTACT.emailHref} className="text-[13px] font-semibold text-orange-300">
                {copy("auth.forgot")}
              </a>
            ) : (
              <button
                type="button"
                onClick={() => change("reset")}
                className="text-[13px] font-semibold text-orange-300"
              >
                {copy("auth.forgot")}
              </button>
            )}
          </div>
        )}
        {registering && (
          <label className="flex items-start gap-3 pt-1 text-[13px] leading-relaxed text-fg-muted">
            <input
              name="acceptedTerms"
              type="checkbox"
              defaultChecked={registration?.acceptedTerms}
              required
              className="mt-0.5 size-5 shrink-0 accent-brand-orange"
            />
            <span>
              {t("I agree to the", "أوافق على")}{" "}
              <a href={origin + "/terms"} target="_blank" rel="noreferrer" className="text-fg">
                {t("Terms of Service", "شروط الخدمة")}
              </a>{" "}
              {t("and", "و")}{" "}
              <a href={origin + "/privacy"} target="_blank" rel="noreferrer" className="text-fg">
                {t("Privacy Policy", "سياسة الخصوصية")}
              </a>
              .
            </span>
          </label>
        )}
        {error && (
          <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">
            {notice}
          </p>
        )}
        <Button
          type="submit"
          block
          loading={busy}
          variant={email && deleting ? "danger" : "primary"}
          className={registering ? "!mt-6" : undefined}
        >
          {googleSignup ? t("Continue with an invitation", "المتابعة باستخدام دعوة") : mainButton}
        </Button>
      </form>
      {!email && (mode === "login" || mode === "register") && (
        <>
          {!googleSignup && (
            <>
              <OrDivider />
              <SocialButtons unavailable onGoogle={googleAction} googleBusy={googleBusy} />
              <p className="mt-2 text-center text-xs text-fg-subtle">
                {googleSignIn
                  ? t("You can also create an account with Google.", "يمكنك أيضاً إنشاء حساب عبر Google.")
                  : t(
                      "Apple and Google sign-in are unavailable during testing.",
                      "تسجيل الدخول عبر Apple وGoogle غير متاح أثناء الاختبار.",
                    )}
              </p>
              {googleSignIn && (
                <p className="mt-2 text-center text-xs text-fg-subtle">
                  {t("By continuing with Google, you agree to the", "بالمتابعة باستخدام Google، فإنك توافق على")}{" "}
                  <a href={origin + "/terms"} target="_blank" rel="noreferrer" className="text-orange-300">
                    {t("Terms of Service", "شروط الخدمة")}
                  </a>{" "}
                  {t("and", "و")}{" "}
                  <a href={origin + "/privacy"} target="_blank" rel="noreferrer" className="text-orange-300">
                    {t("Privacy Policy", "سياسة الخصوصية")}
                  </a>
                  .
                </p>
              )}
            </>
          )}
          <p className="mt-9 text-center text-[14px] text-fg-muted">
            {copy(mode === "login" ? "auth.noAccount" : "auth.haveAccount")}{" "}
            <button
              type="button"
              disabled={busy}
              onClick={() => change(mode === "login" ? "register" : "login")}
              className="font-semibold text-orange-300 hover:text-orange-200"
            >
              {copy(mode === "login" ? "auth.createAccount" : "auth.signin")}
            </button>
          </p>
        </>
      )}
      {!email && (mode === "reset" || mode === "setup") && (
        <Button
          className="mt-5"
          type="button"
          variant="ghost"
          block
          disabled={busy}
          onClick={() => change("login")}
        >
          {copy("auth.signin")}
        </Button>
      )}
      {email && !deleting && (
        <Button className="mt-5" type="button" variant="ghost" block onClick={remove}>
          {t("Delete my account", "حذف حسابي")}
        </Button>
      )}
    </AuthLayout>
  );
}

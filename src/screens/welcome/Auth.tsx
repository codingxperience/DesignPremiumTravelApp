import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ChevronLeft, Eye, EyeOff, LockKeyhole, Mail, MessageSquareText, Phone, UserRound } from 'lucide-react'
import { LogoMark } from '@/brand/Logo'
import { USER } from '@/data/demo'
import { cn } from '@/lib/cn'
import { useAppState, useDispatch, useI18n, useToast } from '@/state/store'
import { Button, IconButton } from '@/ui/Button'
import { CheckMark } from '@/ui/Controls'
import { TextField } from '@/ui/Field'
import { Flag } from '@/ui/Flag'
import { Heading } from '@/ui/Heading'
import { AppleIcon, GoogleIcon } from '@/ui/Icons'
import { EASE_IOS, EASE_OUT, FLIP_RTL } from '@/ui/motion'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function AuthLayout({ title, subtitle, onBack, children }: { title: string; subtitle: string; onBack: () => void; children: ReactNode }) {
  const { t } = useI18n()
  return (
    <section className="absolute inset-0 overflow-hidden bg-ink-900">
      <div aria-hidden className="absolute -top-40 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(22,69,137,0.7),transparent_65%)]" />
      <div aria-hidden className="absolute -end-24 top-24 size-56 rounded-full bg-[radial-gradient(circle,rgba(243,99,36,0.22),transparent_65%)]" />
      <div className="no-scrollbar relative h-full overflow-y-auto overscroll-contain px-6 pb-[calc(var(--sab)+24px)] pt-[calc(var(--sat)+8px)]">
        <div className="flex h-11 items-center justify-between">
          <IconButton label={t('common.back')} onClick={onBack}>
            <ChevronLeft className={FLIP_RTL} />
          </IconButton>
          <LogoMark className="h-7 w-auto" title={t('brand.full')} />
          <span className="size-11" aria-hidden />
        </div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.05 }}>
          <Heading as="h1" size="xl" className="mt-9">
            {title}
          </Heading>
          <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">{subtitle}</p>
        </motion.div>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  )
}

function OrDivider() {
  const { t } = useI18n()
  return (
    <div className="my-7 flex items-center gap-4" role="separator">
      <span className="h-px flex-1 bg-white/10" />
      <span className="text-[12.5px] text-fg-subtle">{t('auth.orContinue')}</span>
      <span className="h-px flex-1 bg-white/10" />
    </div>
  )
}

function SocialButtons() {
  const dispatch = useDispatch()
  const toast = useToast()
  const { t } = useI18n()
  const signIn = (provider: string) => {
    dispatch({ type: 'SIGN_IN' })
    toast(t('auth.socialToast', { provider }))
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      <Button variant="secondary" size="md" icon={<AppleIcon className="size-5" />} onClick={() => signIn('Apple')}>
        {t('auth.apple')}
      </Button>
      <Button variant="secondary" size="md" icon={<GoogleIcon className="size-5" />} onClick={() => signIn('Google')}>
        {t('auth.google')}
      </Button>
    </div>
  )
}

function PasswordToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  const { t } = useI18n()
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
      className="grid size-9 place-items-center rounded-full text-fg-subtle transition-colors hover:text-fg [&_svg]:size-5"
    >
      {visible ? <EyeOff /> : <Eye />}
    </button>
  )
}

function SignIn() {
  const dispatch = useDispatch()
  const toast = useToast()
  const { t, L } = useI18n()
  const [email, setEmail] = useState(USER.email)
  const [password, setPassword] = useState('crossworld2026')
  const [visible, setVisible] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const emailError = submitted && !EMAIL_PATTERN.test(email) ? t('auth.emailError') : undefined

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (!EMAIL_PATTERN.test(email) || !password) return
    setLoading(true)
    window.setTimeout(() => {
      dispatch({ type: 'SIGN_IN' })
      toast(t('auth.welcomeToast', { name: L(USER.firstName) }))
    }, 900)
  }

  return (
    <AuthLayout title={t('auth.welcome')} subtitle={t('auth.signinSub')} onBack={() => dispatch({ type: 'SET_PHASE', phase: 'onboarding' })}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <TextField
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          inputMode="email"
          icon={<Mail />}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={emailError}
          ltr
        />
        <TextField
          label={t('auth.password')}
          type={visible ? 'text' : 'password'}
          autoComplete="current-password"
          icon={<LockKeyhole />}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          trailing={<PasswordToggle visible={visible} onToggle={() => setVisible(!visible)} />}
          ltr
        />
        <div className="flex justify-end">
          <button type="button" onClick={() => toast(t('auth.forgotSent'))} className="text-[13px] font-semibold text-orange-300 hover:text-orange-200">
            {t('auth.forgot')}
          </button>
        </div>
        <Button type="submit" block loading={loading} disabled={!password}>
          {t('auth.signin')}
        </Button>
      </form>
      <OrDivider />
      <SocialButtons />
      <p className="mt-9 text-center text-[14px] text-fg-muted">
        {t('auth.noAccount')}{' '}
        <button type="button" onClick={() => dispatch({ type: 'AUTH_GO', screen: 'signup', dir: 1 })} className="font-semibold text-orange-300 hover:text-orange-200">
          {t('auth.createAccount')}
        </button>
      </p>
    </AuthLayout>
  )
}

function passwordStrength(password: string): 0 | 1 | 2 | 3 {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++
  return Math.min(3, score) as 0 | 1 | 2 | 3
}

function SignUp() {
  const dispatch = useDispatch()
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const strength = passwordStrength(password)
  const strengthLabel = [t('auth.strength.weak'), t('auth.strength.weak'), t('auth.strength.fair'), t('auth.strength.strong')][strength]
  const errors = {
    name: name.trim().length < 2 ? t('auth.nameError') : undefined,
    email: !EMAIL_PATTERN.test(email) ? t('auth.emailError') : undefined,
    phone: phone.replace(/\D/g, '').length < 9 ? t('auth.phoneError') : undefined,
    password: strength < 2 ? t('auth.passwordError') : undefined,
    terms: !agreed ? t('auth.termsError') : undefined,
  }
  const valid = Object.values(errors).every((error) => !error)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (valid) dispatch({ type: 'AUTH_GO', screen: 'verify', dir: 1 })
  }

  return (
    <AuthLayout title={t('auth.createTitle')} subtitle={t('auth.createSub')} onBack={() => dispatch({ type: 'AUTH_GO', screen: 'signin', dir: -1 })}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <TextField
          label={t('auth.fullName')}
          autoComplete="name"
          icon={<UserRound />}
          value={name}
          placeholder="Ahmed Mohamed"
          onChange={(event) => setName(event.target.value)}
          error={submitted ? errors.name : undefined}
        />
        <TextField
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          inputMode="email"
          icon={<Mail />}
          value={email}
          placeholder="name@email.com"
          onChange={(event) => setEmail(event.target.value)}
          error={submitted ? errors.email : undefined}
          ltr
        />
        <TextField
          label={t('auth.phone')}
          type="tel"
          autoComplete="tel-national"
          inputMode="tel"
          icon={
            <span className="flex items-center gap-2 border-e border-white/10 pe-3 text-[15px] font-medium text-fg" dir="ltr">
              <Flag code="gb" className="size-5" />
              +44
            </span>
          }
          value={phone}
          placeholder="7700 900274"
          onChange={(event) => setPhone(event.target.value)}
          error={submitted ? errors.phone : undefined}
          ltr
        />
        <div>
          <TextField
            label={t('auth.password')}
            type={visible ? 'text' : 'password'}
            autoComplete="new-password"
            icon={<LockKeyhole />}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            trailing={<PasswordToggle visible={visible} onToggle={() => setVisible(!visible)} />}
            error={submitted ? errors.password : undefined}
            ltr
          />
          {password && (
            <div className="mt-2.5 flex items-center gap-3" aria-live="polite">
              <div className="flex flex-1 gap-1.5">
                {[1, 2, 3].map((level) => (
                  <span
                    key={level}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors duration-300',
                      strength >= level ? (strength === 3 ? 'bg-success' : strength === 2 ? 'bg-warning' : 'bg-danger') : 'bg-white/10',
                    )}
                  />
                ))}
              </div>
              <span className="text-[12px] text-fg-muted">{strengthLabel}</span>
            </div>
          )}
        </div>
        <button type="button" onClick={() => setAgreed(!agreed)} role="checkbox" aria-checked={agreed} className="flex w-full items-start gap-3 pt-1 text-start">
          <CheckMark checked={agreed} />
          <span className={cn('text-[13px] leading-relaxed', submitted && errors.terms ? 'text-danger' : 'text-fg-muted')}>
            {submitted && errors.terms ? errors.terms : t('auth.terms')}
          </span>
        </button>
        <Button type="submit" block className="!mt-6">
          {t('auth.createAccount')}
        </Button>
      </form>
      <OrDivider />
      <SocialButtons />
      <p className="mt-9 text-center text-[14px] text-fg-muted">
        {t('auth.haveAccount')}{' '}
        <button type="button" onClick={() => dispatch({ type: 'AUTH_GO', screen: 'signin', dir: -1 })} className="font-semibold text-orange-300 hover:text-orange-200">
          {t('auth.signin')}
        </button>
      </p>
    </AuthLayout>
  )
}

const SMS_CODE = '2580'
const RESEND_SECONDS = 30

function Verify() {
  const dispatch = useDispatch()
  const toast = useToast()
  const { t, L, num } = useI18n()
  const [digits, setDigits] = useState(['', '', '', ''])
  const [suggestion, setSuggestion] = useState(false)
  const [seconds, setSeconds] = useState(RESEND_SECONDS)
  const [verifying, setVerifying] = useState(false)
  const inputs = useRef<Array<HTMLInputElement | null>>([])
  const verifyTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    const show = window.setTimeout(() => setSuggestion(true), 1400)
    return () => {
      window.clearTimeout(show)
      window.clearTimeout(verifyTimer.current)
    }
  }, [])

  useEffect(() => {
    if (seconds <= 0) return
    const tick = window.setTimeout(() => setSeconds(seconds - 1), 1000)
    return () => window.clearTimeout(tick)
  }, [seconds])

  const complete = digits.every(Boolean)

  const verify = (code: string[]) => {
    if (!code.every(Boolean) || verifying) return
    setVerifying(true)
    verifyTimer.current = window.setTimeout(() => {
      dispatch({ type: 'SIGN_IN' })
      toast(t('auth.readyToast', { name: L(USER.firstName) }))
    }, 1000)
  }

  const setDigit = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '')
    if (clean.length > 1) return fill(clean)
    const next = [...digits]
    next[index] = clean
    setDigits(next)
    if (clean && index < 3) inputs.current[index + 1]?.focus()
    verify(next)
  }

  const fill = (code: string) => {
    const chars = code.slice(0, 4).split('')
    const next = [0, 1, 2, 3].map((i) => chars[i] ?? '')
    setDigits(next)
    inputs.current[Math.min(chars.length, 3)]?.focus()
    setSuggestion(false)
    verify(next)
  }

  return (
    <AuthLayout
      title={t('auth.verifyTitle')}
      subtitle={t('auth.verifySub', { phone: `\u2066${USER.phoneMasked}\u2069` })}
      onBack={() => dispatch({ type: 'AUTH_GO', screen: 'signup', dir: -1 })}
    >
      <div className="flex justify-between gap-3" dir="ltr">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              inputs.current[index] = element
            }}
            value={digit}
            onChange={(event) => setDigit(index, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Backspace' && !digit && index > 0) inputs.current[index - 1]?.focus()
            }}
            onPaste={(event) => {
              event.preventDefault()
              fill(event.clipboardData.getData('text').replace(/\D/g, ''))
            }}
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={4}
            aria-label={t('auth.codeDigit', { n: index + 1 })}
            className={cn(
              'h-[68px] w-full min-w-0 rounded-[20px] border bg-white/[0.04] text-center text-[26px] font-semibold tabular-nums text-fg outline-none transition-colors focus:border-brand-orange/80 focus:bg-white/[0.07]',
              digit ? 'border-white/25' : 'border-white/10',
            )}
          />
        ))}
      </div>

      <div className="mt-6 h-12">
        <AnimatePresence>
          {suggestion && !complete && (
            <motion.button
              type="button"
              onClick={() => fill(SMS_CODE)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
              className="glass mx-auto flex h-12 items-center gap-3 rounded-full ps-3 pe-5"
            >
              <span className="grid size-7 place-items-center rounded-full bg-success/20 text-success">
                <MessageSquareText className="size-4" />
              </span>
              <span className="text-[13px] text-fg-muted">{t('auth.fromMessages')}</span>
              <span className="text-[16px] font-semibold tracking-[0.3em] tabular-nums" dir="ltr">
                {SMS_CODE}
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <Button block className="mt-4" loading={verifying} disabled={!complete} onClick={() => verify(digits)}>
        {t('auth.verify')}
      </Button>
      <div className="mt-6 flex items-center justify-center gap-2 text-[14px] text-fg-muted">
        <Phone className="size-4" />
        {seconds > 0 ? (
          <span aria-live="polite">{t('auth.resendIn', { s: num(seconds) })}</span>
        ) : (
          <button
            type="button"
            onClick={() => {
              setSeconds(RESEND_SECONDS)
              toast(t('auth.resent'))
            }}
            className="font-semibold text-orange-300 hover:text-orange-200"
          >
            {t('auth.resend')}
          </button>
        )}
      </div>
    </AuthLayout>
  )
}

const AUTH_SCREENS = { signin: SignIn, signup: SignUp, verify: Verify }

export function AuthFlow() {
  const { auth } = useAppState()
  const { isRtl } = useI18n()
  const Current = AUTH_SCREENS[auth.screen]
  const sign = (isRtl ? -1 : 1) * auth.dir
  return (
    <AnimatePresence initial={false} custom={sign}>
      <motion.div
        key={auth.screen}
        className="absolute inset-0"
        custom={sign}
        variants={{
          enter: (direction: number) => ({ x: `${direction * 100}%`, opacity: 1 }),
          center: { x: '0%', opacity: 1 },
          exit: (direction: number) => ({ x: `${direction * -30}%`, opacity: 0 }),
        }}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.44, ease: EASE_IOS }}
      >
        <Current />
      </motion.div>
    </AnimatePresence>
  )
}

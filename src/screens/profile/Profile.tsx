import { useState, type ReactNode } from 'react'
import { Bell, Bookmark, Camera, ChevronRight, CreditCard, FileText, Globe, Languages, LayoutGrid, LogOut, Mail, MessageCircle, Phone, UserRound } from 'lucide-react'
import { LogoLockup } from '@/brand/Logo'
import { CONTACT, USER } from '@/data/demo'
import { cn } from '@/lib/cn'
import { translate, type Lang } from '@/lib/i18n'
import { TAB_BAR_SPACE } from '@/navigation/BottomNav'
import type { NavStyle } from '@/state/routes'
import { useAppState, useDispatch, useI18n, useNav, useToast } from '@/state/store'
import { Button } from '@/ui/Button'
import { Segmented, Switch } from '@/ui/Controls'
import { Heading } from '@/ui/Heading'
import { Card, ListRow } from '@/ui/Misc'
import { Sheet } from '@/ui/Overlay'
import { FLIP_RTL } from '@/ui/motion'
import { Screen } from '@/ui/Screen'
import { Avatar } from '../explore/shared'

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-2.5 px-1 text-[12.5px] font-semibold uppercase tracking-[0.12em] text-fg-subtle">{title}</h2>
      <Card className="divide-y divide-white/[0.06] overflow-hidden">{children}</Card>
    </section>
  )
}

const Chevron = () => <ChevronRight className={cn('size-5 shrink-0 text-fg-subtle', FLIP_RTL)} />

type AccountActions = {
  email: string | null
  fullName?: string | null
  open: (page: 'account' | 'privacy' | 'terms' | 'requests') => void
}

export function ProfileScreen({ account }: { account?: AccountActions }) {
  const { t, L, num } = useI18n()
  const { lang, currency, navStyle, saved, bookings, notificationsEnabled } = useAppState()
  const dispatch = useDispatch()
  const { push, setTab } = useNav()
  const toast = useToast()
  const [signOutOpen, setSignOutOpen] = useState(false)
  const countries = new Set(bookings.map((b) => b.destinationId).filter(Boolean)).size

  const setLang = (value: Lang) => {
    if (value === lang) return
    dispatch({ type: 'SET_LANG', lang: value })
    toast(translate(value, 'lang.changed'))
  }

  const stats = [
    { label: t('profile.stats.trips'), value: bookings.length },
    { label: t('profile.stats.countries'), value: countries },
    { label: t('profile.stats.saved'), value: saved.length },
  ]

  return (
    <Screen bottomInset={TAB_BAR_SPACE} label={t('profile.title')} className="px-5">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[380px] bg-[radial-gradient(90%_70%_at_50%_0%,rgba(22,69,137,0.75),rgba(8,18,38,0)_75%)]" />

      <div className="relative flex flex-col items-center pt-[calc(var(--sat)+28px)] text-center">
        <div className="relative">
          <span className="absolute -inset-1.5 rounded-full bg-[conic-gradient(from_210deg,#f36324,#ffb27a,#164589,#f36324)]" aria-hidden />
          {account ? <span className="relative grid size-[96px] place-items-center rounded-full bg-brand-blue ring-4 ring-ink-900"><UserRound className="size-12 text-white" /></span> : <Avatar id={USER.avatar} alt={USER.name} className="relative size-[96px] ring-4 ring-ink-900" />}
          {!account && <button
            type="button"
            onClick={() => toast(t('profile.photoToast'))}
            aria-label={t('profile.editPhoto')}
            className="absolute -bottom-0.5 end-0 grid size-9 place-items-center rounded-full bg-brand-orange text-ink-950 ring-4 ring-ink-900"
          >
            <Camera className="size-4" />
          </button>}
        </div>
        <Heading as="h1" size="lg" className="mt-5">
          {account ? (account.fullName || account.email?.split('@')[0] || L({ en: 'Traveller', ar: 'مسافر' })) : USER.name}
        </Heading>
        <p className="mt-1 text-[13.5px] text-fg-muted">{account ? account.email || L({ en: 'Traveller account', ar: 'حساب المسافر' }) : L(USER.city)}</p>
        {!account && <p className="mt-0.5 text-[12px] text-fg-subtle">{t('profile.memberSince', { year: num(USER.memberSince) })}</p>}
      </div>

      {!account && <Card className="relative mt-6 grid grid-cols-3 divide-x divide-white/[0.06] py-4 rtl:divide-x-reverse">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-[22px] font-semibold tabular-nums">{num(stat.value)}</p>
            <p className="text-[12px] text-fg-muted">{stat.label}</p>
          </div>
        ))}
      </Card>}

      <Group title={t('profile.travel')}>
        {account && <>
          <ListRow icon={<UserRound />} title={account.email ? L({ en: 'Manage account', ar: 'إدارة الحساب' }) : L({ en: 'Sign in', ar: 'تسجيل الدخول' })} trailing={<Chevron />} onClick={() => account.open('account')} />
          <ListRow icon={<FileText />} title={L({ en: 'My requests', ar: 'طلباتي' })} trailing={<Chevron />} onClick={() => account.open('requests')} />
        </>}
        <ListRow icon={<Bookmark />} title={t('profile.saved')} trailing={<span className="flex items-center gap-2 text-[13px] text-fg-muted">{num(saved.length)}<Chevron /></span>} onClick={() => push({ name: 'saved' })} />
        {!account && <><ListRow icon={<FileText />} title={t('profile.documents')} trailing={<Chevron />} onClick={() => push({ name: 'documents' })} />
        <ListRow icon={<CreditCard />} title={t('profile.payments')} trailing={<Chevron />} onClick={() => push({ name: 'payments' })} /></>}
      </Group>

      <Group title={t('profile.preferences')}>
        <div className="px-4 py-4">
          <p className="mb-3 flex items-center gap-2.5 text-[15px] font-medium">
            <Languages className="size-[19px] text-fg-muted" />
            {t('profile.language')}
          </p>
          <Segmented
            label={t('profile.language')}
            value={lang}
            onChange={setLang}
            options={[
              { value: 'en', label: <span lang="en">English</span> },
              { value: 'ar', label: <span lang="ar">العربية</span> },
            ]}
          />
        </div>
        <div className="px-4 py-4">
          <p className="mb-3 flex items-center gap-2.5 text-[15px] font-medium">
            <LayoutGrid className="size-[19px] text-fg-muted" />
            {t('profile.navStyle')}
          </p>
          <Segmented<NavStyle>
            label={t('profile.navStyle')}
            value={navStyle}
            onChange={(value) => dispatch({ type: 'SET_NAV_STYLE', navStyle: value })}
            options={[
              { value: 'orbit', label: t('nav.style.orbit') },
              { value: 'capsule', label: t('nav.style.capsule') },
              { value: 'ticket', label: t('nav.style.ticket') },
            ]}
          />
          <p className="mt-2.5 text-[12.5px] leading-relaxed text-fg-subtle">{t(`nav.style.${navStyle}.desc`)}</p>
        </div>
        {!account && <><ListRow
          icon={<Bell />}
          title={t('profile.notifications')}
          trailing={
            <Switch
              checked={notificationsEnabled}
              label={t('profile.notifications')}
              onChange={(enabled) => {
                dispatch({ type: 'SET_NOTIFICATIONS_ENABLED', enabled })
                toast(enabled ? t('profile.notificationsOn') : t('profile.notificationsOff'))
              }}
            />
          }
        />
        </>}
        <div className="p-4"><p className="mb-3 text-sm">{t('profile.currency')}</p>
          <Segmented label={t('profile.currency')} value={currency} options={[{value:'GBP',label:'GBP (£)'},{value:'USD',label:'USD ($)'}]} onChange={currency=>dispatch({type:'SET_CURRENCY',currency})} />
          <p className="mt-2 text-xs text-fg-muted">{account ? L({en:'Preferred currency for new quotes.',ar:'العملة المفضلة للعروض الجديدة.'}) : L({en:'Demo USD estimates use the 2 January 2025 reference rate. The desk confirms the final quote.',ar:'تعتمد تقديرات الدولار في العرض على سعر ٢ يناير ٢٠٢٥. يؤكد المكتب العرض النهائي.'})}</p>
        </div>
      </Group>

      <Group title={t('profile.help')}>
        <ListRow icon={<MessageCircle />} title={t('profile.chat')} trailing={<Chevron />} onClick={() => setTab('support')} />
        <ListRow icon={<Phone />} title={t('profile.callUs')} subtitle={<span dir="ltr">{CONTACT.phone}</span>} trailing={<Chevron />} href={CONTACT.phoneHref} />
        <ListRow icon={<Mail />} title={t('profile.emailUs')} subtitle={CONTACT.email} trailing={<Chevron />} href={CONTACT.emailHref} />
        <ListRow icon={<Globe />} title={t('profile.website')} subtitle={CONTACT.website} trailing={<Chevron />} href={CONTACT.websiteHref} />
      </Group>

      {account && <Group title={L({ en: 'Account information', ar: 'معلومات الحساب' })}>
        <ListRow title={L({ en: 'Privacy', ar: 'الخصوصية' })} trailing={<Chevron />} onClick={() => account.open('privacy')} />
        <ListRow title={L({ en: 'Terms of use', ar: 'شروط الاستخدام' })} trailing={<Chevron />} onClick={() => account.open('terms')} />
      </Group>}

      <section className="mt-8">
        <h2 className="mb-2.5 px-1 text-[12.5px] font-semibold uppercase tracking-[0.12em] text-fg-subtle">{t('profile.about')}</h2>
        <Card className="flex flex-col items-center px-6 py-6 text-center">
          <LogoLockup className="w-[118px]" />
          <p className="mt-4 text-[13.5px] font-semibold text-fg-muted">
            <span lang="en">Your Journey, Our Priority</span>
            <span className="mx-2 text-fg-subtle">|</span>
            <span lang="ar">رحلتك، أولويتنا</span>
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-fg-subtle">
            {t('brand.company')}
            <br />
            {t('brand.location')}
          </p>
        </Card>
      </section>

      {!account && <><Button variant="danger" block className="mt-8" icon={<LogOut className="size-5" />} onClick={() => setSignOutOpen(true)}>
        {t('profile.signOut')}
      </Button>
      <p className="mt-4 text-center text-[11.5px] text-fg-subtle">{t('profile.version')}</p>

      <Sheet
        open={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        title={t('profile.signOutTitle')}
        label={t('profile.signOutTitle')}
        footer={
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setSignOutOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => {
                setSignOutOpen(false)
                dispatch({ type: 'SIGN_OUT' })
              }}
            >
              {t('profile.signOut')}
            </Button>
          </div>
        }
      >
        <p className="text-[14.5px] leading-relaxed text-fg-muted">{t('profile.signOutBody')}</p>
      </Sheet></>}
    </Screen>
  )
}

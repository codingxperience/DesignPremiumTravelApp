import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react'
import { SEED_APPLICATIONS, SEED_BOOKINGS, SEED_CARDS, SEED_CHAT } from '@/data/demo'
import type { Application, Booking, ChatMessage, PaymentCard } from '@/data/types'
import { formatClock, formatDate, formatDateRange, formatDuration, formatMoney, formatNumber, formatRelative } from '@/lib/format'
import { translate, translatePlural, type Lang, type Localized, type TKey, type TParams, type TPluralKey } from '@/lib/i18n'
import { conciergeReply } from './concierge'
import type { AuthScreen, NavStyle, Phase, Route, Scenario, Tab } from './routes'
import { buildScenario, isScreenId } from './scenarios'

export type StackEntry = { key: number; route: Route }

export type AppState = {
  phase: Phase
  auth: { screen: AuthScreen; dir: 1 | -1 }
  tab: Tab
  stack: StackEntry[]
  nextKey: number
  lang: Lang
  navStyle: NavStyle
  servicesOpen: boolean
  saved: string[]
  bookings: Booking[]
  applications: Application[]
  notificationsRead: boolean
  notificationsEnabled: boolean
  chat: ChatMessage[]
  agentTyping: boolean
  /** Number of concierge messages the traveller has seen, for the Support badge. */
  chatSeen: number
  cards: PaymentCard[]
  defaultCardId: string
  hajjRegistered: boolean
  toast: { id: number; message: string } | null
}

type Action =
  | { type: 'SET_PHASE'; phase: Phase }
  | { type: 'AUTH_GO'; screen: AuthScreen; dir: 1 | -1 }
  | { type: 'SIGN_IN' }
  | { type: 'SIGN_OUT' }
  | { type: 'SET_TAB'; tab: Tab }
  | { type: 'PUSH'; route: Route }
  | { type: 'POP' }
  | { type: 'RESET'; tab: Tab; routes: Route[] }
  | { type: 'JUMP'; scenario: Scenario }
  | { type: 'SET_LANG'; lang: Lang }
  | { type: 'SET_NAV_STYLE'; navStyle: NavStyle }
  | { type: 'SET_SERVICES_OPEN'; open: boolean }
  | { type: 'TOGGLE_SAVED'; id: string }
  | { type: 'ADD_BOOKING'; booking: Booking }
  | { type: 'SEEN_BOOKING'; id: string }
  | { type: 'RATE_BOOKING'; id: string; rating: number }
  | { type: 'ADD_APPLICATION'; application: Application }
  | { type: 'SEEN_APPLICATION'; id: string }
  | { type: 'MARK_NOTIFICATIONS_READ' }
  | { type: 'SET_NOTIFICATIONS_ENABLED'; enabled: boolean }
  | { type: 'CHAT_SEND'; text: string }
  | { type: 'CHAT_MARK_READ' }
  | { type: 'CHAT_TYPING'; typing: boolean }
  | { type: 'CHAT_REPLY'; reply: Pick<ChatMessage, 'key' | 'card' | 'dateParam'> }
  | { type: 'CHAT_SEEN' }
  | { type: 'ADD_CARD'; card: PaymentCard }
  | { type: 'SET_DEFAULT_CARD'; id: string }
  | { type: 'REGISTER_HAJJ' }
  | { type: 'TOAST'; message: string }
  | { type: 'TOAST_CLEAR'; id: number }

const PREFS_KEY = 'crossworld.prefs'

function readPrefs(): { lang?: Lang; navStyle?: NavStyle } {
  try {
    return JSON.parse(window.localStorage.getItem(PREFS_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function applyScenario(state: AppState, scenario: Scenario): AppState {
  let key = state.nextKey
  const stack = (scenario.routes ?? []).map((route) => ({ key: key++, route }))
  return {
    ...state,
    phase: scenario.phase,
    auth: scenario.auth ? { screen: scenario.auth, dir: 1 } : state.auth,
    tab: scenario.tab ?? 'explore',
    stack,
    nextKey: key,
    servicesOpen: scenario.servicesOpen ?? false,
  }
}

function createInitialState(): AppState {
  const prefs = readPrefs()
  const params = new URLSearchParams(window.location.search)
  const langParam = params.get('lang')
  const navParam = params.get('nav')
  const screenParam = params.get('screen')

  const base: AppState = {
    phase: 'splash',
    auth: { screen: 'signin', dir: 1 },
    tab: 'explore',
    stack: [],
    nextKey: 1,
    lang: langParam === 'ar' || langParam === 'en' ? langParam : (prefs.lang ?? 'en'),
    navStyle: navParam === 'orbit' || navParam === 'capsule' || navParam === 'ticket' ? navParam : (prefs.navStyle ?? 'orbit'),
    servicesOpen: false,
    saved: ['zanzibar', 'maldives'],
    bookings: SEED_BOOKINGS,
    applications: SEED_APPLICATIONS,
    notificationsRead: false,
    notificationsEnabled: true,
    chat: SEED_CHAT,
    agentTyping: false,
    chatSeen: SEED_CHAT.filter((m) => m.from === 'agent').length,
    cards: SEED_CARDS,
    defaultCardId: SEED_CARDS[0].id,
    hajjRegistered: false,
    toast: null,
  }
  return isScreenId(screenParam) ? applyScenario(base, buildScenario(screenParam)) : base
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_PHASE':
      return { ...state, phase: action.phase }
    case 'AUTH_GO':
      return { ...state, phase: 'auth', auth: { screen: action.screen, dir: action.dir } }
    case 'SIGN_IN':
      return { ...state, phase: 'app', tab: 'explore', stack: [], servicesOpen: false }
    case 'SIGN_OUT':
      return { ...state, phase: 'auth', auth: { screen: 'signin', dir: -1 }, tab: 'explore', stack: [], servicesOpen: false }
    case 'SET_TAB':
      return { ...state, tab: action.tab, stack: [], servicesOpen: false }
    case 'PUSH':
      return {
        ...state,
        stack: [...state.stack, { key: state.nextKey, route: action.route }],
        nextKey: state.nextKey + 1,
        servicesOpen: false,
      }
    case 'POP':
      return state.stack.length ? { ...state, stack: state.stack.slice(0, -1) } : state
    case 'RESET':
      return applyScenario(state, { phase: 'app', tab: action.tab, routes: action.routes })
    case 'JUMP':
      return applyScenario(state, action.scenario)
    case 'SET_LANG':
      return { ...state, lang: action.lang }
    case 'SET_NAV_STYLE':
      return { ...state, navStyle: action.navStyle }
    case 'SET_SERVICES_OPEN':
      return { ...state, servicesOpen: action.open }
    case 'TOGGLE_SAVED':
      return {
        ...state,
        saved: state.saved.includes(action.id) ? state.saved.filter((id) => id !== action.id) : [...state.saved, action.id],
      }
    case 'ADD_BOOKING':
      return { ...state, bookings: [action.booking, ...state.bookings] }
    case 'SEEN_BOOKING':
      return { ...state, bookings: state.bookings.map((b) => (b.id === action.id && b.isNew ? { ...b, isNew: false } : b)) }
    case 'RATE_BOOKING':
      return { ...state, bookings: state.bookings.map((b) => (b.id === action.id ? { ...b, rating: action.rating } : b)) }
    case 'ADD_APPLICATION':
      return { ...state, applications: [action.application, ...state.applications] }
    case 'SEEN_APPLICATION':
      return {
        ...state,
        applications: state.applications.map((a) => (a.id === action.id && a.isNew ? { ...a, isNew: false } : a)),
      }
    case 'MARK_NOTIFICATIONS_READ':
      return { ...state, notificationsRead: true }
    case 'SET_NOTIFICATIONS_ENABLED':
      return { ...state, notificationsEnabled: action.enabled }
    case 'CHAT_SEND':
      return {
        ...state,
        chat: [...state.chat, { id: `u${state.nextKey}`, from: 'user', at: Date.now(), text: action.text, read: false }],
        nextKey: state.nextKey + 1,
      }
    case 'CHAT_MARK_READ':
      return { ...state, chat: state.chat.map((m) => (m.from === 'user' && !m.read ? { ...m, read: true } : m)) }
    case 'CHAT_TYPING':
      return { ...state, agentTyping: action.typing }
    case 'CHAT_REPLY':
      return {
        ...state,
        agentTyping: false,
        chat: [...state.chat, { id: `a${state.nextKey}`, from: 'agent', at: Date.now(), ...action.reply }],
        nextKey: state.nextKey + 1,
      }
    case 'CHAT_SEEN': {
      const agentCount = state.chat.filter((m) => m.from === 'agent').length
      return agentCount === state.chatSeen ? state : { ...state, chatSeen: agentCount }
    }
    case 'ADD_CARD':
      return { ...state, cards: [...state.cards, action.card] }
    case 'SET_DEFAULT_CARD':
      return { ...state, defaultCardId: action.id }
    case 'REGISTER_HAJJ':
      return { ...state, hajjRegistered: true }
    case 'TOAST':
      return { ...state, toast: { id: state.nextKey, message: action.message }, nextKey: state.nextKey + 1 }
    case 'TOAST_CLEAR':
      return state.toast?.id === action.id ? { ...state, toast: null } : state
  }
}

const StateContext = createContext<AppState | null>(null)
const DispatchContext = createContext<Dispatch<Action> | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState)

  // Remember language and navigation style, and mirror them into the URL so links can be shared.
  useEffect(() => {
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify({ lang: state.lang, navStyle: state.navStyle }))
    } catch {
      // Storage can be unavailable in private browsing; preferences then last for the session.
    }
    const url = new URL(window.location.href)
    url.searchParams.set('lang', state.lang)
    url.searchParams.set('nav', state.navStyle)
    window.history.replaceState(null, '', url)
  }, [state.lang, state.navStyle])

  // The concierge reads the traveller's latest message, types, then replies.
  const lastMessage = state.chat[state.chat.length - 1]
  const pendingText = lastMessage?.from === 'user' ? (lastMessage.text ?? '') : null
  const pendingId = lastMessage?.from === 'user' ? lastMessage.id : null
  useEffect(() => {
    if (!pendingId || pendingText === null) return
    const timers = [
      window.setTimeout(() => dispatch({ type: 'CHAT_MARK_READ' }), 700),
      window.setTimeout(() => dispatch({ type: 'CHAT_TYPING', typing: true }), 1100),
      window.setTimeout(() => dispatch({ type: 'CHAT_REPLY', reply: conciergeReply(pendingText) }), 2600),
    ]
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [pendingId, pendingText])

  return (
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </DispatchContext.Provider>
  )
}

export function useAppState(): AppState {
  const state = useContext(StateContext)
  if (!state) throw new Error('useAppState must be used inside StoreProvider')
  return state
}

export function useDispatch(): Dispatch<Action> {
  const dispatch = useContext(DispatchContext)
  if (!dispatch) throw new Error('useDispatch must be used inside StoreProvider')
  return dispatch
}

export function useNav() {
  const dispatch = useDispatch()
  return useMemo(
    () => ({
      push: (route: Route) => dispatch({ type: 'PUSH', route }),
      pop: () => dispatch({ type: 'POP' }),
      reset: (tab: Tab, routes: Route[] = []) => dispatch({ type: 'RESET', tab, routes }),
      setTab: (tab: Tab) => dispatch({ type: 'SET_TAB', tab }),
      openServices: (open: boolean) => dispatch({ type: 'SET_SERVICES_OPEN', open }),
    }),
    [dispatch],
  )
}

export function useToast() {
  const dispatch = useDispatch()
  return useMemo(() => (message: string) => dispatch({ type: 'TOAST', message }), [dispatch])
}

export function useI18n() {
  const { lang } = useAppState()
  return useMemo(
    () => ({
      lang,
      dir: (lang === 'ar' ? 'rtl' : 'ltr') as 'rtl' | 'ltr',
      isRtl: lang === 'ar',
      t: (key: TKey, params?: TParams) => translate(lang, key, params),
      tp: (key: TPluralKey, count: number, params?: TParams) => translatePlural(lang, key, count, params),
      L: (value: Localized) => value[lang],
      money: formatMoney,
      num: (value: number) => formatNumber(lang, value),
      date: (iso: string, options: Intl.DateTimeFormatOptions) => formatDate(lang, iso, options),
      range: (start: string, end: string, options?: Intl.DateTimeFormatOptions) => formatDateRange(lang, start, end, options),
      duration: (minutes: number) => formatDuration(lang, minutes),
      clock: (date: Date) => formatClock(lang, date),
      relative: (date: Date) => formatRelative(lang, date, translate(lang, 'status.now')),
    }),
    [lang],
  )
}

export type I18n = ReturnType<typeof useI18n>

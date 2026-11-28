import { useState, useEffect, useCallback, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { Presentation } from "@/shell/Showcase";
import type { ScreenId } from "@/state/scenarios";
import { MotionConfig } from "motion/react";
import { ChevronLeft, TicketsPlane } from "lucide-react";
import { LogoMark } from "@/brand/Logo";
import { DESTINATIONS } from "@/data/destinations";
import { getHotel } from "@/data/hotels";
import { getPackage } from "@/data/packages";
import { getVisaCountry } from "@/data/visas";
import { BottomNav } from "@/navigation/BottomNav";
import { DestinationScreen } from "@/screens/explore/Destination";
import { SplashScreen } from "@/screens/welcome/Splash";
import { OnboardingScreen } from "@/screens/welcome/Onboarding";
import { HomeScreen } from "@/screens/explore/Home";
import { SearchScreen } from "@/screens/explore/Search";
import type { Journey } from "@/screens/flights/JourneyResults";
import { FlightSearchScreen } from "@/screens/flights/FlightSearch";
import { ProfileScreen } from "@/screens/profile/Profile";
import { SavedScreen } from "@/screens/profile/Saved";
import { HotelsScreen } from "@/screens/services/Hotels";
import { HolidaysScreen } from "@/screens/services/Holidays";
import { EgyptScreen } from "@/screens/services/Egypt";
import { VisaScreen } from "@/screens/services/Visa";
import { UmrahScreen } from "@/screens/services/Umrah";
import { NavigationContext, StoreProvider, useDispatch, useI18n } from "@/state/store";
import type { Route, Tab } from "@/state/routes";
import { OverlayRoot } from "@/ui/Overlay";
import { Screen, ScreenHeader } from "@/ui/Screen";
import { ListRow, Card } from "@/ui/Misc";
import { IconButton } from "@/ui/Button";
import { ToastHost } from "@/ui/Toast";
import { StatusBar } from "@/shell/PhoneFrame";
import { Account } from "./Account";
import { TravelSupport } from "./TravelSupport";
import { Policy } from "./Policy";
import { RequestDetail, RequestForm, RequestList } from "./Requests";
import { loadSession, remember, type Service, type Session } from "./api";
import { googleReturnView, listenForGoogle, restoreGoogleReturn } from "./google";
import { Locale } from "./ui";

const tabs: Record<Tab, string> = {
  explore: "home",
  trips: "requests",
  support: "support",
  profile: "profile",
};
restoreGoogleReturn();
const initialToken = new URLSearchParams(location.hash.slice(1)).get("setup") || "";
if (initialToken) history.replaceState(null, "", "#account");

function current() {
  return (
    location.hash.slice(1) ||
    { "/privacy": "privacy", "/terms": "terms", "/delete-account": "delete" }[location.pathname] ||
    "home"
  );
}
function move(next: string, flightSearch?: Journey) {
  if (current() === next) return;
  history.pushState({ travelBack: current(), flightSearch }, "", "#" + next);
  window.dispatchEvent(new Event("hashchange"));
}
function back() {
  if (history.state?.travelBack) history.back();
  else move("home");
}

const reviewRoutes: Partial<Record<ScreenId, string>> = {
  splash: "splash",
  onboarding: "onboarding",
  signup: "signup",
  home: "home",
  signin: "account",
  search: "search",
  destination: "destination/cairo",
  notifications: "notifications",
  flightSearch: "flights",
  hotels: "hotels",
  holidays: "holidays",
  umrah: "umrah",
  visa: "visa",
  egypt: "egypt",
  trips: "requests",
  support: "support",
  profile: "profile",
  saved: "saved",
};

export function TravelApp() {
  return (
    <StoreProvider live>
      <MotionConfig reducedMotion="user">
        <Traveller />
      </MotionConfig>
    </StoreProvider>
  );
}

function Traveller() {
  const [launch, setLaunch] = useState(
    () =>
      current() === "home" && !location.hash && !new URLSearchParams(location.search).has("screen"),
  );
  const finishLaunch = useCallback(() => {
    setLaunch(false);
    if (current() === "splash" || !localStorage.getItem("travel-onboarding-seen"))
      move("onboarding");
  }, []);
  const [view, setView] = useState(current),
    [email, setEmail] = useState<string | null>(null),
    [fullName, setFullName] = useState<string | null>(null),
    [inviteOnly, setInviteOnly] = useState(false),
    [googleSignIn, setGoogleSignIn] = useState(false),
    [passwordless, setPasswordless] = useState(false),
    [loaded, setLoaded] = useState(false);
  const [token, setToken] = useState(initialToken),
    [connection, setConnection] = useState(""),
    [retry, setRetry] = useState(0);
  const { lang } = useI18n(),
    ar = lang === "ar",
    t = (en: string, arabic: string) => (ar ? arabic : en);
  const dispatch = useDispatch();
  const sessionRevision = useRef(0);
  const params = new URLSearchParams(view.split("?")[1] || "");
  const page = view.split("?")[0];
  const [kind, arg] = page.split("/");
  const draftService = params.get("service") || "holiday";
  const service: Service = ["flight", "hotel", "visa", "egypt", "umrah", "approval"].includes(
    draftService,
  )
    ? (draftService as Service)
    : "holiday";
  function plan(
    service: Service = "holiday",
    place = "",
    date?: string,
    groupSize?: number,
    options: { rooms?: number; nationality?: string; flightSearch?: Journey } = {},
  ) {
    const query = new URLSearchParams({ service, place });
    if (date) query.set("date", date);
    if (groupSize) query.set("people", String(groupSize));
    if (options.rooms) query.set("rooms", String(options.rooms));
    if (options.nationality) query.set("nationality", options.nationality);
    move("new?" + query, options.flightSearch);
  }
  useEffect(() => {
    let active = true;
    const revision = sessionRevision.current;
    setConnection("");
    loadSession()
      .then((s) => {
        if (active) {
          setInviteOnly(s.inviteOnly === true);
          setGoogleSignIn(s.googleSignIn === true);
          if (revision === sessionRevision.current) {
            setEmail(s.email);
            setFullName(s.fullName ?? null);
            setPasswordless(s.passwordless === true);
            if (s.inviteOnly) setToken("");
          }
        }
      })
      .catch((e) => {
        if (active) setConnection(e.message);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [retry]);

  const applySession = useCallback((session: Session) => {
    sessionRevision.current += 1;
    setEmail(session.email);
    setFullName(session.fullName ?? null);
    setPasswordless(session.passwordless === true);
    setToken("");
  }, []);

  useEffect(() => listenForGoogle((session) => {
    remember(session);
    applySession(session);
    const destination = googleReturnView(location.hash).slice(1);
    move(destination);
    setLaunch(false);
    setRetry((attempt) => attempt + 1);
  }, () => move("account?google=failed")), [applySession]);

  useEffect(() => {
    const next = () => {
      const incoming = new URLSearchParams(location.hash.slice(1)).get("setup");
      if (incoming) {
        setToken(incoming);
        history.replaceState(null, "", "#account");
      }
      setLaunch(false);
      setView(current());
      dispatch({ type: "SET_SERVICES_OPEN", open: false });
    };
    const expired = () => {
      sessionRevision.current += 1;
      setEmail(null);
      setFullName(null);
      setPasswordless(false);
      setToken("");
    };
    window.addEventListener("hashchange", next);
    window.addEventListener("popstate", next);
    window.addEventListener("travel-session-ended", expired);
    return () => {
      window.removeEventListener("hashchange", next);
      window.removeEventListener("popstate", next);
      window.removeEventListener("travel-session-ended", expired);
    };
  }, [dispatch]);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = ar ? "rtl" : "ltr";
    localStorage.setItem("travel-language", lang);
  }, [ar, lang]);
  const tab: Tab =
    page === "requests" || kind === "trip"
      ? "trips"
      : page === "profile" ||
          page === "account" ||
          page === "signup" ||
          page === "delete" ||
          page === "saved"
        ? "profile"
        : page === "support"
          ? "support"
          : "explore";
  useEffect(() => {
    dispatch({ type: "SET_TAB", tab });
  }, [tab, dispatch]);
  const toggleLang = () => dispatch({ type: "SET_LANG", lang: ar ? "en" : "ar" });
  const open = (id: string) => move("trip/" + id);
  const setTab = (tab: Tab) => {
    dispatch({ type: "SET_SERVICES_OPEN", open: false });
    move(tabs[tab]);
  };
  const push = (route: Route) => {
    switch (route.name) {
      case "destination":
        move("destination/" + route.id);
        break;
      case "flightSearch":
        move("flights" + (route.to ? "?to=" + encodeURIComponent(route.to) : ""));
        break;
      case "flightResults": {
        const q = route.query;
        const details = [
          q.from + " → " + q.to,
          q.ret ? t("return ", "عودة ") + q.ret : "",
          q.cabin,
          q.adults + " " + t("adult(s)", "بالغ"),
          q.children ? q.children + " " + t("child(ren)", "أطفال") : "",
          q.infants ? q.infants + " " + t("infant(s)", "رضع") : "",
        ].filter(Boolean);
        plan("flight", details.join(" · "), q.depart, q.adults + q.children + q.infants);
        break;
      }
      case "booking": {
        if (route.item.kind === "package") {
          const p = getPackage(route.item.packageId);
          plan(
            p.kind === "umrah" ? "umrah" : p.destinationId === "cairo" ? "egypt" : "holiday",
            p.title[lang],
          );
        } else {
          const h = getHotel(route.item.hotelId);
          plan(
            "hotel",
            h.name[lang] + " · " + t("check-out ", "المغادرة ") + route.item.checkOut,
            route.item.checkIn,
            route.item.adults,
            { rooms: route.item.rooms ?? 1 },
          );
        }
        break;
      }
      case "application":
        plan(
          route.service === "egypt" ? "approval" : "visa",
          route.service === "egypt"
            ? t("Egypt security approval", "الموافقة الأمنية لمصر")
            : getVisaCountry(route.countryId)?.name[lang] || route.countryId,
          undefined,
          undefined,
          { nationality: route.service === "egypt" ? route.countryId : undefined },
        );
        break;
      case "hotels":
      case "holidays":
      case "umrah":
      case "visa":
      case "egypt":
      case "search":
      case "notifications":
      case "saved":
        move(route.name);
        break;
    }
  };
  const navigation = {
    push,
    pop: back,
    setTab,
    reset: (tab: Tab) => setTab(tab),
    openServices: (open: boolean) => dispatch({ type: "SET_SERVICES_OPEN", open }),
  };
  const restricted =
    ["new", "requests", "trip", "account", "signup", "delete"].includes(kind) ||
    (page === "support" && params.has("signin"));
  const destination = kind === "destination" && DESTINATIONS.find((d) => d.id === arg);
  function contents() {
    if (page === "splash") return <SplashScreen onComplete={finishLaunch} />;
    if (page === "onboarding") {
      const finish = (next: string) => {
        localStorage.setItem("travel-onboarding-seen", "1");
        move(next);
      };
      return (
        <OnboardingScreen
          initialSlide={params.get("slide") === "3" ? 2 : 0}
          onSkip={() => finish("home")}
          onAuth={(screen) => finish(screen === "signup" ? "signup" : "account")}
        />
      );
    }
    if (
      restricted &&
      loaded &&
      !connection &&
      (!email || ["account", "signup", "delete"].includes(page))
    ) {
      return (
        <Account
          key={view + (inviteOnly ? "" : token)}
          email={!inviteOnly && token ? null : email}
          token={inviteOnly ? "" : token}
          inviteOnly={inviteOnly}
          googleSignIn={googleSignIn}
          googleFailed={params.get("google") === "failed"}
          passwordless={passwordless}
          deleting={page === "delete"}
          startWithSignup={page === "signup"}
          onBack={() => {
            if (history.state?.travelBack?.split("?")[0] === "onboarding")
              move("onboarding?slide=3");
            else back();
          }}
          toggleLang={toggleLang}
          remove={() => move("delete")}
          onSession={applySession}
          onDone={() => {
            if (["account", "signup", "delete"].includes(page)) move("home");
          }}
        />
      );
    }
    if (page === "home") return <HomeScreen traveller={email} />;
    if (page === "search") return <SearchScreen />;
    if (destination)
      return (
        <DestinationScreen
          id={destination.id}
          onEnquire={() =>
            plan(
              destination.category === "umrah"
                ? "umrah"
                : destination.id === "cairo"
                  ? "egypt"
                  : "holiday",
              destination.name[lang],
            )
          }
        />
      );
    if (kind === "flights")
      return (
        <FlightSearchScreen
          onEnquire={(j) =>
            plan(
              "flight",
              j.legs.map((l) => l.from + "–" + l.to).join(" / "),
              j.legs[0].date,
              j.adults + j.children + j.infants,
              { flightSearch: j },
            )
          }
          to={
            /^[A-Z]{3}$/.test(params.get("to") || "") &&
            DESTINATIONS.some((d) => d.airport === params.get("to"))
              ? params.get("to")!
              : undefined
          }
        />
      );
    if (page === "hotels") return <HotelsScreen />;
    if (page === "holidays") return <HolidaysScreen />;
    if (page === "umrah")
      return <UmrahScreen onHajj={() => plan("umrah", t("Hajj, Makkah", "الحج، مكة المكرمة"))} />;
    if (page === "visa") return <VisaScreen />;
    if (page === "egypt") return <EgyptScreen />;
    if (page === "saved") return <SavedScreen />;
    if (page === "profile") return <ProfileScreen account={{ email, fullName, open: move }} />;
    if (page === "support")
      return (
        <TravelSupport
          signedIn={Boolean(email)}
          requestId={params.get("request") || undefined}
          signIn={() => move("support?signin=1")}
          newRequest={() => plan()}
          openRequests={() => move("requests")}
          selectRequest={(id) => move("support?" + new URLSearchParams({ request: id }))}
          openRequest={open}
        />
      );
    if (page === "requests" && email) return <RequestList onOpen={open} onNew={() => plan()} />;
    if (page === "notifications") {
      const title = t("Notifications", "الإشعارات");
      return (
        <Screen label={title} header={<ScreenHeader title={title} />} className="px-5 pt-5">
          <Card>
            <ListRow
              icon={<TicketsPlane />}
              title={t("Travel file updates", "تحديثات ملف السفر")}
              subtitle={t(
                "Open your requests for quotes and replies.",
                "افتح طلباتك للاطلاع على العروض والردود.",
              )}
              onClick={() => move("requests")}
            />
          </Card>
        </Screen>
      );
    }
    return (
      <div className="desk-scroll" key={view}>
        <div className="desk-bar">
          <IconButton label={t("Back", "رجوع")} onClick={back}>
            <ChevronLeft className="rtl:rotate-180" />
          </IconButton>
          <LogoMark className="h-7 w-auto" />
          <button onClick={toggleLang}>{ar ? "English" : "العربية"}</button>
        </div>
        <div className="desk">
          {page === "privacy" || page === "terms" ? (
            <Policy terms={page === "terms"} remove={() => move("delete")} />
          ) : restricted && !loaded ? (
            <section className="panel" role="status">
              {t("Opening your travel file…", "جارٍ فتح ملف السفر…")}
            </section>
          ) : restricted && connection ? (
            <section className="panel">
              <h1>{t("Travel desk unavailable", "مكتب السفر غير متاح")}</h1>
              <p>{t("Check your connection and try again.", "تحقق من اتصالك وحاول مجدداً.")}</p>
              <button
                className="secondary"
                onClick={() => {
                  setLoaded(false);
                  setRetry((v) => v + 1);
                }}
              >
                {t("Retry", "إعادة المحاولة")}
              </button>
            </section>
          ) : page === "new" ? (
            <RequestForm
              service={service}
              nationality={params.get("nationality") || ""}
              rooms={Number(params.get("rooms")) || 1}
              flightSearch={history.state?.flightSearch}
              place={params.get("place") || ""}
              date={params.get("date") || undefined}
              groupSize={Number(params.get("people")) || undefined}
              onOpen={open}
            />
          ) : kind === "trip" ? (
            <RequestDetail
              id={arg}
              back={() => move("requests")}
              openConversation={() => move("support?" + new URLSearchParams({ request: arg }))}
            />
          ) : (
            <button onClick={() => move("home")}>{t("Explore", "اكتشف")}</button>
          )}
        </div>
      </div>
    );
  }
  return (
    <Locale.Provider value={ar}>
      <NavigationContext.Provider value={navigation}>
        <Presentation
          device={Capacitor.isNativePlatform()}
          review={{
            routes: reviewRoutes,
            current:
              Object.keys(reviewRoutes).find((id) => reviewRoutes[id as ScreenId] === page) ?? kind,
            open: (id) => {
              const target = reviewRoutes[id];
              if (target) move(target);
            },
          }}
          render={(mode) => (
            <div
              lang={lang}
              dir={ar ? "rtl" : "ltr"}
              className={mode === "device" ? "travel-device" : "travel-framed"}
            >
              <OverlayRoot>
                <main key={view} className="absolute inset-0">
                  {launch && page === "home" ? (
                    <SplashScreen onComplete={finishLaunch} />
                  ) : (
                    contents()
                  )}
                </main>
                <BottomNav
                  visible={
                    !launch &&
                    ["home", "requests", "profile", "support"].includes(page) &&
                    (!restricted || Boolean(email))
                  }
                />
                <ToastHost />
              </OverlayRoot>
              {mode === "frame" && (
                <>
                  <StatusBar />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute bottom-2 left-1/2 z-[95] h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-white/85"
                  />
                </>
              )}
            </div>
          )}
        />
      </NavigationContext.Provider>
    </Locale.Provider>
  );
}

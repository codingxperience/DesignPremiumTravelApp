import { DESTINATIONS } from "@/data/destinations";
import { TAB_BAR_SPACE } from "@/navigation/BottomNav";
import { useAppState, useI18n } from "@/state/store";
import { Button } from "@/ui/Button";
import { Segmented } from "@/ui/Controls";
import { Heading } from "@/ui/Heading";
import { Img } from "@/ui/Img";
import { Badge } from "@/ui/Misc";
import { Screen } from "@/ui/Screen";
import { InternationalPhone } from "@/ui/InternationalPhone";
import type { Journey } from "@/screens/flights/JourneyResults";
import { useCallback, useContext, useEffect, useState, type FormEvent } from "react";
import { api, type Detail, type Trip, type Service } from "./api";
import { Locale, services, shortDate, today, useText } from "./ui";

export function useLoad<T>(route: string, retain = false) {
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(""),
    [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setError("");
    if (!retain) setData(null);
    api<T>(route)
      .then((value) => {
        if (active) setData(value);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [route, version, retain]);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  return { data, error, refresh };
}
function LoadState({ error, retry }: { error: string; retry: () => void }) {
  const t = useText();
  return (
    <div className="panel" role="status">
      {error || t("Loading…", "جارٍ التحميل…")}
      {error && (
        <button className="text-button" onClick={retry}>
          {t("Try again", "إعادة المحاولة")}
        </button>
      )}
    </div>
  );
}

export function RequestForm({
  service,
  place,
  date,
  groupSize,
  rooms,
  nationality,
  flightSearch,
  onOpen,
}: {
  service: Service;
  place: string;
  date?: string;
  groupSize?: number;
  rooms: number;
  nationality: string;
  flightSearch?: Journey;
  onOpen: (id: string) => void;
}) {
  const t = useText(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [key] = useState(() => crypto.randomUUID());
  const { currency } = useAppState();
  const [selected, setSelected] = useState(service),
    [people, setPeople] = useState(groupSize ?? 1),
    [roomCount, setRoomCount] = useState(rooms);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const details = {
        clientId: key,
        service: selected,
        destination: form.get("destination"),
        departure: form.get("departure"),
        travellers: people,
        preferredCurrency: form.get("currency"),
        phone: form.get("phone") || "",
        ...(selected === "hotel" ? { rooms: roomCount } : {}),
        ...(selected === "flight" && flightSearch ? { flightSearch } : {}),
      };
      let item: Trip;
      if (selected === "approval") {
        const ticket = form.get("ticket");
        if (!(ticket instanceof File) || !ticket.size || ticket.size > 2097152)
          throw Error(
            t(
              "Choose a flight ticket image under 2 MB.",
              "اختر صورة تذكرة طيران أصغر من ٢ ميغابايت.",
            ),
          );
        const upload = new FormData();
        upload.set("details", JSON.stringify(details));
        upload.set("nationality", nationality);
        upload.set("ticket", ticket);
        item = await api<Trip>("approval", upload);
      } else item = await api<Trip>("trips/create", details);
      onOpen(item.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <p className="kicker">{t("Travel desk", "مكتب السفر")}</p>
      <h1>{t("Plan a journey", "خطط لرحلتك")}</h1>
      <p>
        {t(
          "Tell the desk where and when you want to travel. Your quote and replies will appear here.",
          "أخبر المكتب بوجهتك وموعد سفرك. ستجد عرض السعر والردود هنا.",
        )}
      </p>
      <form onSubmit={submit}>
        <label>
          {t("Service", "الخدمة")}
          <select
            name="service"
            disabled={service === "approval" || !!flightSearch}
            value={selected}
            onChange={(e) => setSelected(e.target.value as Service)}
          >
            {Object.entries(services)
              .filter(([id]) => id !== "approval" || service === "approval")
              .map(([id, pair]) => (
                <option key={id} value={id}>
                  {t(...pair)}
                </option>
              ))}
          </select>
        </label>
        <label>
          {t("Destination or route", "الوجهة أو المسار")}
          <input
            name="destination"
            defaultValue={place}
            required
            minLength={2}
            maxLength={120}
            dir="auto"
          />
        </label>
        <div className="pair">
          <label>
            {t("Departure date", "تاريخ المغادرة")}
            <input
              type="date"
              name="departure"
              readOnly={!!flightSearch}
              defaultValue={date}
              min={today()}
              required
            />
          </label>
          <label>
            {t("Travellers", "المسافرون")}
            <select
              name="travellers"
              disabled={!!flightSearch}
              value={people}
              onChange={(e) => {
                const n = Number(e.target.value);
                setPeople(n);
                setRoomCount((r) => Math.min(r, n));
              }}
            >
              {Array.from({ length: 9 }, (_, i) => (
                <option key={i}>{i + 1}</option>
              ))}
            </select>
          </label>
        </div>
        {selected === "hotel" && (
          <label>
            {t("Rooms", "الغرف")}
            <select value={roomCount} onChange={(e) => setRoomCount(Number(e.target.value))}>
              {Array.from({ length: people }, (_, i) => (
                <option key={i}>{i + 1}</option>
              ))}
            </select>
          </label>
        )}
        {selected === "approval" && (
          <label>
            {t("Flight ticket (required)", "تذكرة الطيران (إلزامية)")}
            <input name="ticket" type="file" accept="image/jpeg,image/png" required />
            <small>
              {t(
                "JPEG or PNG photo or screenshot, up to 2 MB.",
                "صورة أو لقطة شاشة JPEG أو PNG حتى ٢ ميغابايت.",
              )}
            </small>
          </label>
        )}
        {flightSearch && (
          <ol>
            {flightSearch.legs.map((l, i) => (
              <li key={i}>
                <bdi>
                  {l.from} → {l.to} · {l.date}
                </bdi>
              </li>
            ))}
          </ol>
        )}
        <InternationalPhone />
        <label>
          {t("Preferred quote currency", "عملة العرض المفضلة")}
          <select name="currency" defaultValue={currency}>
            <option value="GBP">GBP (£)</option>
            <option value="USD">USD ($)</option>
          </select>
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="primary" disabled={busy}>
          {busy ? t("Sending…", "جارٍ الإرسال…") : t("Send travel request", "إرسال طلب السفر")}
        </button>
      </form>
    </section>
  );
}

export function RequestList({
  onOpen,
  onNew,
}: {
  onOpen: (id: string) => void;
  onNew: () => void;
}) {
  const t = useText(),
    { t: copy } = useI18n(),
    ar = useContext(Locale),
    [period, setPeriod] = useState<"upcoming" | "past">("upcoming"),
    [page, setPage] = useState(1),
    { data, error, refresh } = useLoad<{ trips: Trip[]; more: boolean }>(
      "trips?" + new URLSearchParams({ period, page: String(page) }),
    );
  return (
    <Screen
      bottomInset={TAB_BAR_SPACE}
      label={copy("trips.title")}
      className="px-5 pt-[calc(var(--sat)+18px)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(110%_60%_at_80%_0%,rgba(22,69,137,0.55),rgba(8,18,38,0)_70%)]"
      />
      <Heading as="h1" size="xl" className="relative">
        {copy("trips.title")}
      </Heading>
      <Segmented
        className="relative mt-5"
        label={copy("trips.title")}
        value={period}
        onChange={(value) => {
          setPeriod(value);
          setPage(1);
        }}
        options={[
          { value: "upcoming", label: copy("trips.upcoming") },
          { value: "past", label: copy("trips.past") },
        ]}
      />
      <div className="relative my-6 space-y-4">
        {!data ? (
          <LoadState error={error} retry={refresh} />
        ) : (
          <>
            {!data.trips.length && (
              <p className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-sm text-fg-muted">
                {period === "past"
                  ? t(
                      "Your earlier travel requests will appear here.",
                      "ستظهر طلبات سفرك السابقة هنا.",
                    )
                  : t(
                      "Your upcoming travel requests will appear here.",
                      "ستظهر طلبات سفرك القادمة هنا.",
                    )}
              </p>
            )}
            {data.trips.map((trip) => {
              const name = trip.destination.trim().toLowerCase();
              const destination = DESTINATIONS.find((place) =>
                [place.id, place.name.en.toLowerCase(), place.name.ar].includes(name),
              );
              return (
                <button
                  type="button"
                  className="relative block h-[226px] w-full overflow-hidden rounded-[28px] bg-ink-800 text-start shadow-[0_26px_40px_-26px_rgba(0,0,0,0.9)]"
                  key={trip.id}
                  onClick={() => onOpen(trip.id)}
                >
                  {destination && (
                    <Img
                      id={destination.image}
                      alt=""
                      width={350}
                      height={226}
                      className="absolute inset-0 size-full"
                    />
                  )}
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,11,23,0.55)_0%,rgba(5,11,23,0.05)_38%,rgba(5,11,23,0.92)_100%)]"
                  />
                  <div className="absolute inset-x-4 top-4">
                    <Badge tone="glass">{t(...services[trip.service])}</Badge>
                  </div>
                  <div className="absolute inset-x-4 bottom-4">
                    <p dir="auto" className="heading text-[22px] leading-[1.1] text-white">
                      {trip.destination}
                    </p>
                    <p className="mt-1.5 text-[13px] text-white/80">
                      {shortDate(trip.departure, ar)} · {trip.travellers}{" "}
                      {t("travellers", "مسافرين")}
                    </p>
                  </div>
                </button>
              );
            })}
            <div className="flex justify-between gap-2">
              {page > 1 && (
                <Button size="sm" variant="secondary" onClick={() => setPage(page - 1)}>
                  {t("Previous", "السابق")}
                </Button>
              )}
              {data.more && (
                <Button size="sm" variant="secondary" onClick={() => setPage(page + 1)}>
                  {t("Next", "التالي")}
                </Button>
              )}
            </div>
          </>
        )}
        <Button block onClick={onNew}>
          {t("New travel request", "طلب سفر جديد")}
        </Button>
      </div>
    </Screen>
  );
}

export function RequestDetail({
  id,
  back,
  openConversation,
}: {
  id: string;
  back: () => void;
  openConversation: () => void;
}) {
  const t = useText(),
    ar = useContext(Locale),
    route = "trips/" + id,
    { data, error, refresh } = useLoad<Detail>(route),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  async function act(action: string, payload: unknown) {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      await api(route + "/" + action, payload);
      refresh();
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!data) return <LoadState error={error} retry={refresh} />;
  const q = data.quote;
  return (
    <>
      <button className="text-button" onClick={back}>
        {t("‹ My requests", "طلباتي ›")}
      </button>
      <section className="panel">
        <p className="kicker">{t(...services[data.service])}</p>
        <h1 dir="auto">{data.destination}</h1>
        <p>
          {shortDate(data.departure, ar)} · {data.travellers} {t("travellers", "مسافرين")}
        </p>
        {data.rooms && (
          <p>
            {t("Rooms", "الغرف")}: {data.rooms}
          </p>
        )}
        {data.preferredCurrency && (
          <p>
            {t("Preferred quote currency", "عملة العرض المفضلة")}: {data.preferredCurrency}
          </p>
        )}
        {data.flightSearch?.legs?.map((leg, i) => (
          <p key={i}>
            <bdi>
              {leg.from} → {leg.to} · {leg.date}
            </bdi>
          </p>
        ))}
        <div className="status-strip">
          <span aria-hidden="true">●</span>
          {data.confirmation
            ? t("Booking confirmed by the travel desk", "تم تأكيد الحجز من مكتب السفر")
            : q
              ? q.accepted
                ? t("Quote accepted", "تم قبول العرض")
                : q.expired
                  ? t("Quote expired", "انتهت صلاحية العرض")
                  : t("Your quote is ready", "عرض السعر جاهز")
              : t("Request received", "تم استلام الطلب")}
        </div>
        {data.confirmation && (
          <section className="offer">
            <h2>{t("Booking confirmation", "تأكيد الحجز")}</h2>
            <p dir="auto">{data.confirmation.supplier}</p>
            <small>{t("Supplier reference", "مرجع المورد")}</small>
            <strong dir="ltr">{data.confirmation.reference}</strong>
            <p dir="auto">{data.confirmation.itinerary}</p>
          </section>
        )}
        {q && (
          <div className="offer">
            <strong>
              {new Intl.NumberFormat(ar ? "ar" : "en-GB", {
                style: "currency",
                currency: q.currency,
              }).format(Number(q.amount))}
            </strong>
            <p dir="auto">{q.details}</p>
            <small>
              {t("Valid through", "صالح حتى")} {shortDate(q.until, ar)}
            </small>
            {!q.accepted && !q.expired && (
              <button
                className="primary"
                disabled={busy}
                onClick={() => act("accept", { quoteId: q.id })}
              >
                {t("Accept this quote", "قبول العرض")}
              </button>
            )}
            <p>
              {t(
                "No payment is taken. The desk confirms the booking separately.",
                "لا يتم تحصيل دفعة. يؤكّد المكتب الحجز بشكل منفصل.",
              )}
            </p>
          </div>
        )}
        {data.attachmentRequested && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              void act("attachment", form);
            }}
          >
            <label>
              {t("Photo requested by the desk", "صورة مطلوبة من المكتب")}
              <input type="file" name="image" accept="image/jpeg,image/png" required />
              <small>{t("JPEG or PNG, up to 2 MB.", "JPEG أو PNG، بحد أقصى ٢ ميغابايت.")}</small>
            </label>
            <button className="secondary" disabled={busy}>
              {data.attached
                ? t("Replace photo", "استبدال الصورة")
                : t("Send photo", "إرسال الصورة")}
            </button>
          </form>
        )}
      </section>
      <section className="panel">
        <h2>{t("Conversation", "المحادثة")}</h2>
        <button type="button" className="primary" onClick={openConversation}>
          {t("Message the travel desk", "راسل مكتب السفر")}
        </button>
        <button type="button" className="text-button" onClick={refresh} disabled={busy}>
          {t("Refresh travel file", "تحديث ملف السفر")}
        </button>
      </section>
      {notice && (
        <p className="error" role="alert">
          {notice}
        </p>
      )}
    </>
  );
}

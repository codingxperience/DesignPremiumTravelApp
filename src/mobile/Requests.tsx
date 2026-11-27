import { useAppState } from "@/state/store";
import { InternationalPhone } from "@/ui/InternationalPhone";
import type { Journey } from "@/screens/flights/JourneyResults";
import { useContext, useEffect, useState, type FormEvent } from "react";
import { api, type Detail, type Trip, type Service } from "./api";
import { Locale, services, shortDate, today, useText } from "./ui";

function useLoad<T>(route: string) {
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(""),
    [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setError("");
    setData(null);
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
  }, [route, version]);
  return { data, error, refresh: () => setVersion((v) => v + 1) };
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
    ar = useContext(Locale),
    [page, setPage] = useState(1),
    { data, error, refresh } = useLoad<{ trips: Trip[]; more: boolean }>("trips?page=" + page);
  return (
    <section className="panel">
      <p className="kicker">{t("Travel desk", "مكتب السفر")}</p>
      <h1>{t("My requests", "طلباتي")}</h1>
      {!data ? (
        <LoadState error={error} retry={refresh} />
      ) : (
        <>
          {!data.trips.length && (
            <p>
              {t(
                "Your first journey starts with a request. Once you send it, you can follow it here.",
                "تبدأ رحلتك الأولى بطلب. بعد إرساله يمكنك متابعته هنا.",
              )}
            </p>
          )}
          {data.trips.map((trip) => (
            <button className="trip-row" key={trip.id} onClick={() => onOpen(trip.id)}>
              <span>
                <small>{t(...services[trip.service])}</small>
                <strong dir="auto">{trip.destination}</strong>
              </span>
              <span>{shortDate(trip.departure, ar)} ›</span>
            </button>
          ))}
          <div className="links">
            {page > 1 && (
              <button onClick={() => setPage(page - 1)}>{t("Previous", "السابق")}</button>
            )}
            {data.more && <button onClick={() => setPage(page + 1)}>{t("Next", "التالي")}</button>}
          </div>
        </>
      )}
      <button className="primary" onClick={onNew}>
        {t("New travel request", "طلب سفر جديد")}
      </button>
    </section>
  );
}

export function RequestDetail({ id, back }: { id: string; back: () => void }) {
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
      setOlder([]);
      setMore(true);
      refresh();
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const [older, setOlder] = useState<Detail["messages"]>([]);
  const [more, setMore] = useState(true);
  const allMessages = [...older, ...(data?.messages ?? [])].filter(
    (m, i, items) => i === 0 || items[i - 1].id !== m.id,
  );
  async function loadEarlier() {
    if (!allMessages.length || busy) return;
    setBusy(true);
    try {
      const batch = await api<{ messages: Detail["messages"]; more: boolean }>(
        route + "/history?before=" + allMessages[0].id,
      );
      setOlder((prev) => [...batch.messages, ...prev]);
      setMore(batch.more);
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
        <button
          className="text-button"
          onClick={() => {
            setOlder([]);
            setMore(true);
            refresh();
          }}
          disabled={busy}
        >
          {t("Refresh travel file", "تحديث ملف السفر")}
        </button>
        {more && data.messages.length === 100 && (
          <button className="text-button" disabled={busy} onClick={loadEarlier}>
            {t("Earlier messages", "الرسائل السابقة")}
          </button>
        )}
        {allMessages.length === 0 ? (
          <p>
            {t("Ask the travel desk a question about this request.", "اسأل المكتب عن هذا الطلب.")}
          </p>
        ) : (
          allMessages.map((m) => (
            <div className={"message " + (m.staff ? "staff" : "")} key={m.id}>
              <small>{m.staff ? t("Travel desk", "مكتب السفر") : t("You", "أنت")}</small>
              <p dir="auto">{m.body}</p>
            </div>
          ))
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void act("messages", { body: new FormData(e.currentTarget).get("body") });
          }}
        >
          <label>
            {t("Message", "الرسالة")}
            <textarea name="body" rows={3} required maxLength={1000} />
          </label>
          <button className="secondary" disabled={busy}>
            {t("Send message", "إرسال رسالة")}
          </button>
        </form>
      </section>
      {notice && (
        <p className="error" role="alert">
          {notice}
        </p>
      )}
    </>
  );
}

import { useEffect, useState } from "react";
import { searchFlights } from "@/data/flights";
import type { Cabin, FlightQuery } from "@/data/types";
import { api } from "@/mobile/api";
import { useI18n, useLiveApp, useNav } from "@/state/store";
import { Screen, ScreenHeader } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Misc";

export type Leg = { from: string; to: string; date: string };
export type Journey = {
  mode: "oneway" | "return" | "multi";
  legs: Leg[];
  cabin: Cabin;
  adults: number;
  children: number;
  infants: number;
  stops: "any" | "direct" | "one";
  window: "any" | "morning" | "afternoon" | "evening";
};
type Option = {
  airline: string;
  number: string;
  departure: string;
  duration: number;
  stops: number;
  id?: string;
  price?: number;
};

export function JourneyResults({
  initial,
  edit,
  onEnquire,
}: {
  initial: Journey;
  edit: () => void;
  onEnquire?: (j: Journey) => void;
}) {
  const { L, t, duration, date, money } = useI18n(),
    live = useLiveApp(),
    { push } = useNav();
  const [query, setQuery] = useState(initial),
    [groups, setGroups] = useState<Option[][] | null>(null),
    [error, setError] = useState(false),
    [retry, setRetry] = useState(0);
  const [sort, setSort] = useState("departure");
  const copy = (en: string, ar: string) => L({ en, ar });
  const legacy = (leg: Leg): FlightQuery => ({
    tripType: query.mode === "return" ? "return" : "oneway",
    from: leg.from,
    to: leg.to,
    depart: leg.date,
    ret: query.mode === "return" ? query.legs[1].date : undefined,
    cabin: query.cabin,
    adults: query.adults,
    children: query.children,
    infants: query.infants,
  });
  useEffect(() => {
    let active = true;
    setError(false);
    if (live) {
      setGroups(null);
      api<{ results: Option[][] }>("flight-search", query)
        .then((r) => {
          if (active) setGroups(r.results);
        })
        .catch(() => {
          if (active) setError(true);
        });
    } else {
      setGroups(
        query.legs.map((leg) =>
          searchFlights({
            tripType: "oneway",
            from: leg.from,
            to: leg.to,
            depart: leg.date,
            cabin: query.cabin,
            adults: query.adults,
            children: query.children,
            infants: query.infants,
          })
            .filter((f) => {
              const hour = Number(f.dep.slice(0, 2));
              return (
                (query.stops === "any" || f.stops <= (query.stops === "direct" ? 0 : 1)) &&
                (query.window === "any" ||
                  (hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening") === query.window)
              );
            })
            .map((f) => ({
              id: f.id,
              airline: L(f.airline.name),
              price: f.price,
              number: f.number,
              departure: f.dep,
              duration: f.durationMin,
              stops: f.stops,
            })),
        ),
      );
    }
    return () => {
      active = false;
    };
  }, [query, live, retry, L]);
  return (
    <Screen
      label={t("flights.title")}
      header={<ScreenHeader title={t("flights.title")} onBack={edit} />}
      className="space-y-4 px-5 pb-10"
    >
      <h2 className="heading text-2xl">{copy("Flight options", "خيارات الرحلات")}</h2>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          {copy("Stops", "التوقفات")}
          <select
            className="mt-1 w-full rounded-xl bg-ink-800 p-2"
            value={query.stops}
            onChange={(e) => setQuery({ ...query, stops: e.target.value as Journey["stops"] })}
          >
            <option value="any">{copy("Any stops", "أي عدد")}</option>
            <option value="direct">{t("flights.directOnly")}</option>
            <option value="one">{copy("Up to one stop", "حتى توقف واحد")}</option>
          </select>
        </label>
        <label className="text-sm">
          {copy("Departure time", "وقت المغادرة")}
          <select
            className="mt-1 w-full rounded-xl bg-ink-800 p-2"
            value={query.window}
            onChange={(e) => setQuery({ ...query, window: e.target.value as Journey["window"] })}
          >
            <option value="any">{copy("Any time", "أي وقت")}</option>
            <option value="morning">00:00–11:59</option>
            <option value="afternoon">12:00–17:59</option>
            <option value="evening">18:00–23:59</option>
          </select>
        </label>
      </div>
      <label className="block text-sm">
        {copy("Sort by", "ترتيب حسب")}
        <select
          className="ms-2 rounded-xl bg-ink-800 p-2"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="departure">{copy("Departure time", "وقت المغادرة")}</option>
          <option value="fastest">{t("flights.sort.fastest")}</option>
          {!live && <option value="cheapest">{t("flights.sort.cheapest")}</option>}
        </select>
      </label>
      {error ? (
        <div role="alert">
          {copy("The flight list could not be loaded.", "تعذر تحميل الرحلات.")}{" "}
          <button onClick={() => setRetry((n) => n + 1)}>{copy("Retry", "إعادة المحاولة")}</button>
        </div>
      ) : !groups ? (
        <p role="status">{copy("Searching…", "جارٍ البحث…")}</p>
      ) : (
        query.legs.map((leg, i) => (
          <section key={i}>
            <h3 className="font-semibold">
              <bdi>
                {leg.from} → {leg.to}
              </bdi>{" "}
              · {date(leg.date, { day: "numeric", month: "short" })}
            </h3>
            {groups[i]?.length ? (
              [...groups[i]]
                .sort((a, b) =>
                  sort === "fastest"
                    ? a.duration - b.duration
                    : sort === "cheapest"
                      ? (a.price ?? 0) - (b.price ?? 0)
                      : a.departure.localeCompare(b.departure),
                )
                .map((f, n) => (
                  <Card key={n} className="my-2 p-4">
                    <strong>
                      {f.airline} · {f.number}
                    </strong>
                    <p>
                      {f.departure.slice(0, 5)} · {duration(f.duration)} ·{" "}
                      {f.stops === 0
                        ? t("common.direct")
                        : String(f.stops) + " " + copy("stops", "توقفات")}
                    </p>
                    {f.price !== undefined && <p>{money(f.price)}</p>}
                    {!live && i === 0 && query.mode !== "multi" && f.id && (
                      <button
                        className="mt-2 text-orange-300"
                        onClick={() =>
                          push({ name: "flightDetails", query: legacy(leg), flightId: f.id! })
                        }
                      >
                        {copy("View fares", "عرض الأسعار")}
                      </button>
                    )}
                  </Card>
                ))
            ) : (
              <p className="my-2 text-sm text-fg-muted">
                {copy("No published flights match this search.", "لا توجد رحلات منشورة تطابق بحثك.")}
              </p>
            )}
          </section>
        ))
      )}
      {onEnquire && (
        <Button block onClick={() => onEnquire(query)}>
          {copy("Request flight quote", "طلب عرض طيران")}
        </Button>
      )}
      <Button block variant="secondary" onClick={edit}>
        {t("flights.edit")}
      </Button>
    </Screen>
  );
}

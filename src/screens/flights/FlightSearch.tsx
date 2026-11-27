import { motion } from "motion/react";
import { useState } from "react";
import { ArrowRight, ArrowUpDown, CalendarDays, Clock3, Plus, Search, Users } from "lucide-react";
import { JourneyResults, type Journey, type Leg } from "./JourneyResults";
import { AIRPORTS, getAirport } from "@/data/airports";
import type { Cabin, FlightQuery } from "@/data/types";
import { cn } from "@/lib/cn";
import { fromToday, TODAY_ISO } from "@/lib/dates";
import { useI18n, useLiveApp, useNav } from "@/state/store";
import { Button } from "@/ui/Button";
import { Segmented } from "@/ui/Controls";
import { PickerField } from "@/ui/Field";
import { Heading } from "@/ui/Heading";
import { Card, SectionHeader } from "@/ui/Misc";
import { FLIP_RTL, SPRING } from "@/ui/motion";
import { Screen, ScreenHeader, StickyFooter } from "@/ui/Screen";
import { AirportSheet, cabinKey, DatesSheet, PassengersSheet } from "./parts";

type SheetName = "from" | "to" | "dates" | "pax";

const RECENT: FlightQuery[] = [
  {
    tripType: "return",
    from: "LHR",
    to: "IST",
    depart: fromToday(35),
    ret: fromToday(39),
    adults: 2,
    children: 0,
    infants: 0,
    cabin: "economy",
  },
  {
    tripType: "return",
    from: "MAN",
    to: "JED",
    depart: fromToday(60),
    ret: fromToday(70),
    adults: 1,
    children: 0,
    infants: 0,
    cabin: "premium",
  },
];

function AirportRow({
  label,
  code,
  onClick,
}: {
  label: string;
  code: string;
  onClick: () => void;
}) {
  const { L } = useI18n();
  const airport = getAirport(code);
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col items-start px-4 py-3.5 pe-20 text-start"
    >
      <span className="text-[12px] font-medium text-fg-subtle">{label}</span>
      <span className="mt-1 flex items-baseline gap-2.5">
        <span className="heading text-[26px] leading-none tracking-[0.01em]">{airport.code}</span>
        <span className="text-[15px] font-semibold">{L(airport.city)}</span>
      </span>
      <span className="mt-1 text-[12.5px] text-fg-muted">{L(airport.name)}</span>
    </button>
  );
}

export function FlightSearchScreen({
  to: initialTo,
  onEnquire,
}: {
  to?: string;
  onEnquire?: (j: Journey) => void;
}) {
  const { t, tp, L, date } = useI18n();
  const live = useLiveApp();
  const { push } = useNav();
  const [tripType, setTripType] = useState<Journey["mode"]>("return");
  const [from, setFrom] = useState("LHR");
  const [to, setTo] = useState(initialTo ?? "CAI");
  const [depart, setDepart] = useState(fromToday(21));
  const [ret, setRet] = useState(fromToday(28));
  const [pax, setPax] = useState<{
    adults: number;
    children: number;
    infants: number;
    cabin: Cabin;
  }>({ adults: 1, children: 0, infants: 0, cabin: "economy" });
  const [sheet, setSheet] = useState<SheetName | null>(null);
  const [extra, setExtra] = useState<Leg[]>([
    { from: initialTo ?? "CAI", to: initialTo === "JED" ? "LHR" : "JED", date: fromToday(28) },
  ]);
  const [results, setResults] = useState<Journey | null>(null);
  const [invalid, setInvalid] = useState("");
  const [turns, setTurns] = useState(0);

  const travellers = pax.adults + pax.children + pax.infants;
  const fmt = (iso: string) => date(iso, { weekday: "short", day: "numeric", month: "short" });
  function search() {
    const legs: Leg[] = [
      { from, to, date: depart },
      ...(tripType === "multi"
        ? extra
        : tripType === "return"
          ? [{ from: to, to: from, date: ret }]
          : []),
    ];
    if (
      legs.some(
        (l, i) =>
          !l.date ||
          l.date < TODAY_ISO ||
          l.date > fromToday(730) ||
          l.from === l.to ||
          (i > 0 && l.date < legs[i - 1].date),
      )
    ) {
      setInvalid(
        L({
          en: "Choose different airports for each leg and dates in travel order.",
          ar: "اختر مطارات مختلفة لكل رحلة وتواريخ بالترتيب.",
        }),
      );
      return;
    }
    setInvalid("");
    setResults({ mode: tripType, legs, ...pax, stops: "any", window: "any" });
  }
  if (results)
    return <JourneyResults initial={results} edit={() => setResults(null)} onEnquire={onEnquire} />;

  const swap = () => {
    setFrom(to);
    setTo(from);
    setTurns((n) => n + 1);
  };

  return (
    <Screen
      label={t("flights.title")}
      header={<ScreenHeader title={t("flights.title")} />}
      footer={
        <StickyFooter>
          <Button block onClick={search} icon={<Search className="size-5" />}>
            {t("flights.search")}
          </Button>
        </StickyFooter>
      }
      className="px-5 pt-2"
    >
      <Heading as="h2" size="xl">
        {t("flights.heading")}
      </Heading>

      <Segmented
        className="mt-6"
        label={t("flights.title")}
        value={tripType}
        onChange={setTripType}
        options={[
          { value: "return", label: t("flights.return") },
          { value: "oneway", label: t("flights.oneway") },
          { value: "multi", label: L({ en: "Multi-city", ar: "مدن متعددة" }) },
        ]}
      />

      <Card className="relative mt-4">
        <AirportRow label={t("flights.from")} code={from} onClick={() => setSheet("from")} />
        <div className="mx-4 border-t border-white/[0.06]" />
        <AirportRow label={t("flights.to")} code={to} onClick={() => setSheet("to")} />
        <motion.button
          type="button"
          onClick={swap}
          aria-label={t("flights.swap")}
          animate={{ rotate: turns * 180 }}
          transition={SPRING}
          whileTap={{ scale: 0.9 }}
          className="absolute end-5 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-brand-orange text-ink-950 shadow-[0_12px_24px_-10px_rgba(243,99,36,0.9)]"
        >
          <ArrowUpDown className="size-5" />
        </motion.button>
      </Card>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <PickerField
          label={t("flights.depart")}
          icon={<CalendarDays />}
          value={fmt(depart)}
          onClick={() => setSheet("dates")}
        />
        {tripType === "return" ? (
          <PickerField
            label={t("flights.returnDate")}
            icon={<CalendarDays />}
            value={fmt(ret)}
            onClick={() => setSheet("dates")}
          />
        ) : tripType === "oneway" ? (
          <button
            type="button"
            onClick={() => setTripType("return")}
            className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 text-[14px] font-semibold text-fg-muted transition-colors hover:text-fg"
          >
            <Plus className="size-4" />
            {t("flights.addReturn")}
          </button>
        ) : null}
      </div>
      {tripType === "multi" && (
        <div className="mt-4 space-y-3">
          {extra.map((leg, i) => {
            function update(change: Partial<Leg>) {
              setExtra((all) =>
                all.map((old, index) => (index === i ? { ...old, ...change } : old)),
              );
            }
            return (
              <Card className="space-y-2 p-4" key={i}>
                <h3 className="font-semibold">
                  {L({ en: "Flight", ar: "الرحلة" })} {i + 2}
                </h3>
                {(["from", "to"] as const).map((key) => (
                  <label className="block text-sm" key={key}>
                    {t(key === "from" ? "flights.from" : "flights.to")}
                    <select
                      className="mt-1 block w-full rounded-xl bg-ink-800 p-2"
                      value={leg[key]}
                      onChange={(e) => update({ [key]: e.target.value })}
                    >
                      {AIRPORTS.map((a) => (
                        <option key={a.code} value={a.code}>
                          {a.code} · {L(a.city)}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
                <label className="block text-sm">
                  {t("flights.depart")}
                  <input
                    className="mt-1 block w-full rounded-xl bg-ink-800 p-2"
                    type="date"
                    min={i === 0 ? depart : extra[i - 1].date}
                    value={leg.date}
                    onChange={(e) => update({ date: e.target.value })}
                  />
                </label>
                {extra.length > 1 && (
                  <button
                    className="text-orange-300"
                    onClick={() => setExtra((all) => all.filter((_, n) => n !== i))}
                  >
                    {L({ en: "Remove flight", ar: "حذف الرحلة" })}
                  </button>
                )}
              </Card>
            );
          })}
          {extra.length < 5 && (
            <Button
              variant="secondary"
              onClick={() => {
                const last = extra[extra.length - 1];
                setExtra([
                  ...extra,
                  { from: last.to, to: last.to === "LHR" ? "CAI" : "LHR", date: last.date },
                ]);
              }}
            >
              {L({ en: "Add another flight", ar: "إضافة رحلة" })}
            </Button>
          )}
        </div>
      )}
      {invalid && (
        <p role="alert" className="mt-3 text-danger">
          {invalid}
        </p>
      )}
      <PickerField
        className="mt-3 w-full"
        label={t("flights.passengers")}
        icon={<Users />}
        value={`${tp("common.travellers", travellers)} · ${t(cabinKey(pax.cabin))}`}
        onClick={() => setSheet("pax")}
      />

      {!live && (
        <>
          <SectionHeader title={t("flights.recent")} className="mt-9 px-0" />
          <div className="mt-3 space-y-2.5">
            {RECENT.map((recent) => (
              <button
                key={`${recent.from}-${recent.to}`}
                type="button"
                onClick={() => push({ name: "flightResults", query: recent })}
                className="flex w-full items-center gap-3.5 rounded-[20px] border border-white/[0.07] bg-white/[0.03] px-4 py-3.5 text-start transition-colors hover:bg-white/[0.06]"
              >
                <span className="grid size-10 place-items-center rounded-[13px] bg-white/[0.06] text-fg-muted">
                  <Clock3 className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-[14.5px] font-semibold">
                    {L(getAirport(recent.from).city)}
                    <ArrowRight className={cn("size-3.5 text-fg-subtle", FLIP_RTL)} aria-hidden />
                    {L(getAirport(recent.to).city)}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] text-fg-muted">
                    {fmt(recent.depart)} · {tp("common.travellers", recent.adults)} ·{" "}
                    {t(cabinKey(recent.cabin))}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <AirportSheet
        open={sheet === "from"}
        onClose={() => setSheet(null)}
        title={t("flights.from")}
        selected={from}
        exclude={to}
        onSelect={setFrom}
      />
      <AirportSheet
        open={sheet === "to"}
        onClose={() => setSheet(null)}
        title={t("flights.to")}
        selected={to}
        exclude={from}
        onSelect={setTo}
      />
      <DatesSheet
        open={sheet === "dates"}
        onClose={() => setSheet(null)}
        mode={tripType === "return" ? "range" : "single"}
        start={depart}
        end={tripType === "return" ? ret : undefined}
        onApply={(start, end) => {
          setDepart(start);
          if (end) setRet(end);
        }}
      />
      <PassengersSheet
        open={sheet === "pax"}
        onClose={() => setSheet(null)}
        value={pax}
        onApply={setPax}
      />
    </Screen>
  );
}

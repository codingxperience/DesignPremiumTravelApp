import { useContext, useState } from "react";
import { PACKAGES } from "@/data/packages";
import { Locale, useText } from "./ui";
import type { Service } from "./api";

export function Journeys({ plan }: { plan: (service: Service, destination: string) => void }) {
  const t = useText(),
    lang = useContext(Locale) ? "ar" : "en",
    [expanded, setExpanded] = useState(false);
  const ideas = expanded
    ? PACKAGES
    : PACKAGES.filter((p) => ["cairo-nile", "umrah-essentials", "zanzibar-escape"].includes(p.id));
  return (
    <section className="directory">
      <h2>{t("Journey ideas", "أفكار للرحلات")}</h2>
      <div className="ideas">
        {ideas.map((p) => (
          <details key={p.id}>
            <summary>
              <strong>{p.title[lang]}</strong>
              <small>
                {p.nights} {t("nights", "ليالٍ")}
              </small>
            </summary>
            <p>{p.summary[lang]}</p>
            <button
              className="text-button"
              onClick={() =>
                plan(
                  p.kind === "umrah" ? "umrah" : p.destinationId === "cairo" ? "egypt" : "holiday",
                  p.title[lang],
                )
              }
            >
              {t("Request this itinerary", "طلب برنامج الرحلة")}
            </button>
          </details>
        ))}
      </div>
      <button className="text-button" onClick={() => setExpanded(!expanded)}>
        {expanded
          ? t("Show fewer itineraries", "عرض رحلات أقل")
          : t("All itineraries", "جميع الرحلات")}
      </button>
    </section>
  );
}

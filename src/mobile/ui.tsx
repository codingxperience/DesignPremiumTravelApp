import { createContext, useContext } from "react";
import type { Service } from "./api";
export const Locale = createContext(false);
export function useText() {
  const ar = useContext(Locale);
  return (en: string, arabic: string) => (ar ? arabic : en);
}
export const services: Record<Service, [string, string]> = {
  flight: ["Flights", "الرحلات الجوية"],
  hotel: ["Hotels", "الفنادق"],
  holiday: ["Holidays", "العطلات"],
  visa: ["Visa assistance", "المساعدة في التأشيرات"],
  umrah: ["Umrah", "العمرة"],
  approval: ["Egypt security approval","الموافقة الأمنية لمصر"],
  egypt: ["Egypt tours", "جولات مصر"],
};
export function shortDate(date: string, ar: boolean) {
  return new Intl.DateTimeFormat(ar ? "ar" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date + "T12:00:00Z"));
}
export function today() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

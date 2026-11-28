import { useId, useMemo, useState } from "react";
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/min";
import { useI18n } from "@/state/store";
import { Flag } from "@/ui/Flag";

export function InternationalPhone({
  required = false,
  onChange,
  initialValue,
}: {
  required?: boolean;
  onChange?: (phone: string) => void;
  initialValue?: string;
}) {
  const { lang, L } = useI18n();
  const phoneId = useId();
  const [initial] = useState(() => initialValue && parsePhoneNumberFromString(initialValue));
  const [region, setRegion] = useState<CountryCode>(initial ? (initial.country ?? "GB") : "GB");
  const [national, setNational] = useState(initial ? initial.nationalNumber : "");
  const countries = useMemo(() => {
    const names = new Intl.DisplayNames([lang], { type: "region" });
    return getCountries()
      .map((code) => ({ code, name: names.of(code) ?? code, dial: getCountryCallingCode(code) }))
      .sort((a, b) => a.name.localeCompare(b.name, lang));
  }, [lang]);
  const normalize = (value: string, code: CountryCode) => {
    const parsed = parsePhoneNumberFromString(value, { defaultCountry: code, extract: false });
    return parsed?.isPossible() ? parsed.number : "";
  };
  const value = normalize(national, region);
  const invalid = L({
    en: "Enter a valid number for the selected country or include its calling code.",
    ar: "أدخل رقماً صحيحاً للبلد المحدد أو أدرج رمز الاتصال الدولي.",
  });
  const callingCode = L({ en: "Country calling code", ar: "رمز الاتصال الدولي" });
  const marker = String.fromCodePoint(
    ...Array.from(region, (letter) => letter.charCodeAt(0) + 127397),
  );
  return (
    <div className="space-y-2">
      <label htmlFor={phoneId} className="block text-[13px] font-medium text-fg-muted">
        {required
          ? L({ en: "Mobile number", ar: "رقم الجوال" })
          : L({ en: "Contact phone (optional)", ar: "هاتف التواصل (اختياري)" })}
      </label>
      <div
        dir="ltr"
        className="flex h-14 items-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 focus-within:border-brand-orange/70"
      >
        <div className="relative flex h-full shrink-0 items-center gap-2 border-e border-white/10 pe-3">
          {region === "GB" ? <Flag code="gb" /> : <span aria-hidden>{marker}</span>}
          <span className="text-[13px] font-semibold" aria-hidden>
            +{getCountryCallingCode(region)}
          </span>
          <select
            aria-label={callingCode}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
            value={region}
            onChange={(e) => {
              const code = e.target.value as CountryCode;
              setRegion(code);
              onChange?.(normalize(national, code));
            }}
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} (+{c.dial})
              </option>
            ))}
          </select>
        </div>
        <input
          id={phoneId}
          className="h-full min-w-0 flex-1 bg-transparent ps-3 text-[15px] text-fg outline-none placeholder:text-fg-subtle"
          dir="ltr"
          type="tel"
          autoComplete="tel"
          placeholder={region === "GB" ? "7700 900274" : undefined}
          required={required}
          maxLength={40}
          value={national}
          ref={(el) => {
            el?.setCustomValidity(national && !value ? invalid : "");
          }}
          onChange={(e) => {
            setNational(e.target.value);
            onChange?.(normalize(e.target.value, region));
          }}
        />
      </div>
      <input type="hidden" name="phone" value={value} />
    </div>
  );
}

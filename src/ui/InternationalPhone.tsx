import { useMemo, useState } from "react";
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/min";
import { useI18n } from "@/state/store";

export function InternationalPhone({
  required = false,
  onChange,
}: {
  required?: boolean;
  onChange?: (phone: string) => void;
}) {
  const { lang, L } = useI18n();
  const [region, setRegion] = useState<CountryCode>("GB");
  const [national, setNational] = useState("");
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
  return (
    <div className="space-y-2">
      <label className="block text-sm">
        {L({ en: "Country calling code", ar: "رمز الاتصال الدولي" })}
        <select
          className="mt-1 block h-12 w-full rounded-xl bg-ink-800 px-3"
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
      </label>
      <label className="block text-sm">
        {required
          ? L({ en: "Mobile number", ar: "رقم الجوال" })
          : L({ en: "Contact phone (optional)", ar: "هاتف التواصل (اختياري)" })}
        <input
          className="mt-1 block h-12 w-full rounded-xl bg-ink-800 px-3"
          dir="ltr"
          type="tel"
          autoComplete="tel"
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
      </label>
      <input type="hidden" name="phone" value={value} />
    </div>
  );
}

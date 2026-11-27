import { useEffect, useState } from "react";
import { api } from "@/mobile/api";

export function useApprovalCountries() {
  const [countries, setCountries] = useState<string[] | null>(null),
    [failed, setFailed] = useState(false),
    [attempt, retry] = useState(0);
  useEffect(() => {
    let active = true;
    setCountries(null);
    setFailed(false);
    if (import.meta.env.MODE === "showcase") {
      setCountries([]);
      return;
    }
    api<{ countries: string[] }>("approval-countries")
      .then((data) => {
        if (active) setCountries(data.countries);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  return { countries, failed, retry: () => retry((n) => n + 1) };
}

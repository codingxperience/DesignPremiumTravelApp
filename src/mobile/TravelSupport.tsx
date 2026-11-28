import { useEffect, useState, type ReactNode } from "react";
import { ChevronRight, RefreshCw } from "lucide-react";
import type { ChatMessage } from "@/data/types";
import { SupportScreen } from "@/screens/support/Support";
import { Button, IconButton } from "@/ui/Button";
import { Flag } from "@/ui/Flag";
import { api, type Detail, type Trip } from "./api";
import { useLoad } from "./Requests";
import { services, useText } from "./ui";

type SupportProps = {
  signedIn: boolean;
  requestId?: string;
  signIn: () => void;
  newRequest: () => void;
  openRequests: () => void;
  selectRequest: (id: string) => void;
  openRequest: (id: string) => void;
};

export function TravelSupport({ signedIn, signIn, ...props }: SupportProps) {
  const t = useText();
  if (!signedIn) {
    return (
      <SupportScreen
        live={{
          messages: [],
          empty: t(
            "Sign in to see your conversations with the travel desk.",
            "سجّل الدخول للاطلاع على محادثاتك مع مكتب السفر.",
          ),
          action: { label: t("Sign in", "تسجيل الدخول"), run: signIn },
        }}
      />
    );
  }
  return <RequestSupport {...props} />;
}

function RequestSupport({
  requestId,
  newRequest,
  openRequests,
  selectRequest,
  openRequest,
}: Omit<SupportProps, "signedIn" | "signIn">) {
  const t = useText();
  const { data, error, refresh } = useLoad<{ trips: Trip[]; more: boolean }>("trips", true);
  const activeId = requestId || data?.trips[0]?.id;
  const allRequests = data?.trips ?? [];
  const controls =
    activeId && data ? (
      <div className="my-4 flex items-center gap-2">
        <select
          aria-label={t("Travel request", "طلب السفر")}
          value={activeId}
          onChange={(event) => selectRequest(event.target.value)}
          className="glass h-10 min-w-0 flex-1 truncate rounded-xl bg-ink-850 px-3 text-[13px]"
        >
          {!allRequests.some((trip) => trip.id === activeId) && (
            <option value={activeId}>{t("Selected request", "الطلب المحدد")}</option>
          )}
          {allRequests.map((trip) => (
            <option key={trip.id} value={trip.id}>
              {trip.destination} · {t(...services[trip.service])}
            </option>
          ))}
        </select>
        {data.more && (
          <Button variant="secondary" size="sm" onClick={openRequests}>
            {t("All requests", "كل الطلبات")}
          </Button>
        )}
      </div>
    ) : null;

  if (!activeId) {
    return (
      <SupportScreen
        live={{
          messages: [],
          empty:
            error ||
            (data
              ? t(
                  "Start a travel request to chat with the desk about your plans.",
                  "ابدأ طلب سفر لمحادثة المكتب بشأن رحلتك.",
                )
              : t("Opening your conversations…", "جارٍ فتح محادثاتك…")),
          action: error
            ? { label: t("Try again", "إعادة المحاولة"), run: refresh }
            : data
              ? { label: t("New travel request", "طلب سفر جديد"), run: newRequest }
              : undefined,
        }}
      />
    );
  }
  return (
    <Conversation
      key={activeId}
      id={activeId}
      controls={controls}
      open={() => openRequest(activeId)}
    />
  );
}

function Conversation({
  id,
  controls,
  open,
}: {
  id: string;
  controls: ReactNode;
  open: () => void;
}) {
  const t = useText();
  const route = "trips/" + id;
  const { data, error, refresh } = useLoad<Detail>(route, true);
  const [older, setOlder] = useState<Detail["messages"]>([]);
  const [more, setMore] = useState<boolean | null>(null);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [historyError, setHistoryError] = useState("");
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 15000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const latest = data?.messages ?? [];
  const merged = new Map([...older, ...latest].map((message) => [message.id, message]));
  const messages: ChatMessage[] = [...merged.values()].map((message) => ({
    id: String(message.id),
    from: message.staff ? "agent" : "user",
    at: new Date(message.created).getTime(),
    text: message.body,
  }));

  async function earlier() {
    const first = older[0] ?? latest[0];
    if (!first || loadingEarlier) return;
    setLoadingEarlier(true);
    setHistoryError("");
    try {
      const result = await api<{ messages: Detail["messages"]; more: boolean }>(
        route + "/history?before=" + first.id,
      );
      setOlder((previous) => [...result.messages, ...previous]);
      setMore(result.more);
    } catch (failure) {
      setHistoryError(
        failure instanceof Error
          ? failure.message
          : t("Could not load earlier messages.", "تعذّر تحميل الرسائل السابقة."),
      );
    } finally {
      setLoadingEarlier(false);
    }
  }

  const quote = data?.quote;
  const status = data?.confirmation
    ? t("Booking confirmed", "تم تأكيد الحجز")
    : quote?.accepted
      ? t("Quote accepted", "تم قبول العرض")
      : quote?.expired
        ? t("Quote expired", "انتهت صلاحية العرض")
        : quote
          ? t("Quote ready", "عرض السعر جاهز")
          : t("Request received", "تم استلام الطلب");

  return (
    <SupportScreen
      live={{
        messages,
        empty: !data && error ? error : undefined,
        action:
          error && !data ? { label: t("Try again", "إعادة المحاولة"), run: refresh } : undefined,
        send: data
          ? async (body) => {
              await api(route + "/messages", { body });
              refresh();
            }
          : undefined,
        attach: data?.attachmentRequested ? open : undefined,
        controls: (
          <>
            {controls}
            {data && (
              <div className="my-4 rounded-2xl border border-white/10 bg-ink-850/80 p-3">
                <div className="flex items-center gap-2.5">
                  {data.service === "approval" && <Flag code="eg" className="size-7" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold">
                      {t(...services[data.service])}
                    </p>
                    <p dir="auto" className="truncate text-xs text-fg-muted">
                      {data.destination}
                    </p>
                  </div>
                  <IconButton
                    size="sm"
                    label={t("Refresh messages", "تحديث الرسائل")}
                    onClick={refresh}
                  >
                    <RefreshCw />
                  </IconButton>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-orange-200">{status}</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={open}
                    iconEnd={<ChevronRight className="size-4 rtl:rotate-180" />}
                  >
                    {t("View status", "عرض الحالة")}
                  </Button>
                </div>
              </div>
            )}
            {(more ?? latest.length === 100) && (
              <Button
                size="sm"
                variant="ghost"
                className="mb-3"
                loading={loadingEarlier}
                onClick={earlier}
              >
                {t("Earlier messages", "الرسائل السابقة")}
              </Button>
            )}
            {(historyError || (error && data)) && (
              <p role="status" className="mb-3 text-xs text-danger">
                {historyError || error}
              </p>
            )}
          </>
        ),
      }}
    />
  );
}

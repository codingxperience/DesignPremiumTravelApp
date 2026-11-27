import { useText } from "./ui";
export function Policy({ terms, remove }: { terms: boolean; remove: () => void }) {
  const t = useText();
  return (
    <article className="panel policy">
      <h1>{terms ? t("Terms of use", "شروط الاستخدام") : t("Privacy", "الخصوصية")}</h1>
      {terms ? (
        <>
          <h2>{t("Travel requests", "طلبات السفر")}</h2>
          <p>
            {t(
              "Submit accurate information for yourself or people who have authorised you. Your request starts a conversation with the travel desk. Availability and supplier conditions must be confirmed separately.",
              "أرسل معلومات دقيقة عنك أو عمّن فوّضك. يبدأ الطلب محادثة مع مكتب السفر. يتطلب التوفر وشروط المورد تأكيداً منفصلاً.",
            )}
          </p>
          <h2>{t("Quotes and payments", "العروض والمدفوعات")}</h2>
          <p>
            {t(
              "A quote shows the total, currency, inclusions and validity entered by the agency. Accepting it records your interest. The app does not charge a card, issue a ticket or sell a subscription. Ask the desk for booking, cancellation and refund terms before paying a supplier.",
              "يعرض عرض السعر المبلغ والعملة والتفاصيل وفترة الصلاحية. قبول العرض يسجل رغبتك. لا يخصم التطبيق مبالغ من بطاقتك ولا يصدر تذاكر أو اشتراكات. اطلب شروط الحجز والإلغاء والاسترداد قبل الدفع.",
            )}
          </p>
        </>
      ) : (
        <>
          <h2>{t("Your travel file", "ملف السفر")}</h2>
          <p>
            {t(
              "Cross World Travel uses your email and a password hash to manage your account. The travel desk receives the service, destination, date, party size, messages, quote decisions, supplier confirmations and any photo you choose to send. The desk also receives your optional contact phone, preferred currency, selected rooms or flight legs and filters. Egypt approval applications include passport nationality and a flight ticket image.",
              "تستخدم كروس وورلد ترافل بريدك وبصمة مشفرة لكلمة المرور لإدارة حسابك. يتلقى المكتب نوع الخدمة والوجهة والتاريخ وعدد المسافرين والرسائل وقرارات العروض وتأكيدات الحجز والصورة التي ترسلها. يتلقى المكتب أيضاً هاتف التواصل الاختياري والعملة المفضلة وعدد الغرف أو مسار الرحلات وتفضيلاتها. يشمل طلب الموافقة الأمنية لمصر جنسية جواز السفر وصورة التذكرة.",
            )}
          </p>
          <h2>{t("Storage and access", "التخزين والوصول")}</h2>
          <p>
            {t(
              "Authorised agency staff can read requests. Hosting and email providers process information to run the service and deliver account links. The app stores your language, navigation and currency choices on your device. Browser sessions use essential cookies. On a phone, the app holds the sign-in token in memory. Network and sign-in identifiers are keyed before use in rate limits. This client includes no advertising or analytics SDK.",
              "يمكن للموظفين المخولين قراءة الطلبات. يعالج مزودو الاستضافة والبريد البيانات لتشغيل الخدمة وإرسال روابط الحساب. يحفظ التطبيق تفضيلات اللغة والتنقل والعملة على جهازك. يستخدم المتصفح ملفات ارتباط أساسية، ويحتفظ تطبيق الهاتف برمز الدخول في الذاكرة. تُحوَّل معرّفات الشبكة والدخول إلى بصمات بمفتاح لتقييد المحاولات. لا يتضمن التطبيق أدوات إعلانات أو تحليلات.",
            )}
          </p>
          <h2>{t("Keeping and deleting data", "الاحتفاظ بالبيانات وحذفها")}</h2>
          <p>
            {t(
              "Your account and travel file remain until deleted. Account deletion removes them from the active database. Email already delivered and operational backups have separate lifecycles. Account links expire after 30 minutes and sign-in sessions after eight hours.",
              "يبقى حسابك وملف السفر حتى الحذف. يزيل الحذف البيانات من قاعدة البيانات النشطة. للبريد المرسل والنسخ الاحتياطية دورات احتفاظ منفصلة. تنتهي روابط الحساب بعد ٣٠ دقيقة وجلسات الدخول بعد ثماني ساعات.",
            )}
          </p>
          <button className="text-button" onClick={remove}>
            {t("Delete account and travel data", "حذف الحساب وبيانات السفر")}
          </button>
        </>
      )}
      <h2>{t("Contact", "للتواصل")}</h2>
      <a href="mailto:cwt@crossworldtravelagency.com">cwt@crossworldtravelagency.com</a>
    </article>
  );
}

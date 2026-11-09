import { useEffect, useState } from 'react';
import { CheckCircle2, Copy, MessageCircle, Printer, RefreshCw } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { whatsappLink } from '@/data/shop';
import { fetchBookingStatuses, type BookingStatus, type BookingStatusRecord } from '@/lib/booking-api';
import { formatRupees } from '@/lib/format';
import { useLanguage } from '@/lib/language';
import { findSavedBooking, type SavedBooking } from '@/lib/saved-bookings';
import type { Bilingual } from '@/types/catalog';

const STATUS_LABELS: Record<BookingStatus, Bilingual> = {
  new: { en: 'New', hi: 'नई' },
  pending: { en: 'Pending', hi: 'लंबित' },
  confirmed: { en: 'Confirmed', hi: 'पुष्ट' },
  ready: { en: 'Ready', hi: 'तैयार' },
  completed: { en: 'Completed', hi: 'पूरी हुई' },
  rejected: { en: 'Rejected', hi: 'अस्वीकृत' },
  cancelled: { en: 'Cancelled', hi: 'रद्द' },
};

const RECEIVED: Bilingual = {
  en: 'Your booking request has been received successfully. The Fashion House team will contact you after the shop confirms it.',
  hi: 'आपकी बुकिंग सफलतापूर्वक प्राप्त हो गई है। दुकान द्वारा पुष्टि के बाद Fashion House की टीम आपसे संपर्क करेगी।',
};

const HEADLINES: Record<BookingStatus, Bilingual> = {
  new: RECEIVED,
  pending: RECEIVED,
  confirmed: {
    en: 'Good news! The shop has confirmed your booking. The team will contact you about the next steps.',
    hi: 'खुशखबरी! दुकान ने आपकी बुकिंग की पुष्टि कर दी है। टीम अगले कदमों के लिए आपसे संपर्क करेगी।',
  },
  ready: {
    en: 'Your order is ready. Please contact the shop to arrange pick-up or delivery.',
    hi: 'आपका ऑर्डर तैयार है। पिकअप या डिलीवरी के लिए कृपया दुकान से संपर्क करें।',
  },
  completed: {
    en: 'This booking is completed. Thank you for shopping with Fashion House!',
    hi: 'यह बुकिंग पूरी हो चुकी है। Fashion House से खरीदारी के लिए धन्यवाद!',
  },
  rejected: {
    en: 'Sorry, the shop could not accept this booking request. The pieces have been released. Please contact us for help.',
    hi: 'क्षमा करें, दुकान यह बुकिंग अनुरोध स्वीकार नहीं कर सकी। कपड़े वापस उपलब्ध कर दिए गए हैं। मदद के लिए हमसे संपर्क करें।',
  },
  cancelled: {
    en: 'This booking has been cancelled and the pieces have been released. You are welcome to send a new request.',
    hi: 'यह बुकिंग रद्द कर दी गई है और कपड़े वापस उपलब्ध कर दिए गए हैं। आप नया अनुरोध भेज सकते हैं।',
  },
};

export function BookingConfirmationPage() {
  const { t, language } = useLanguage();
  const { code = '' } = useParams();
  const [saved] = useState<SavedBooking | undefined>(() => findSavedBooking(code));
  const [record, setRecord] = useState<BookingStatusRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadStatus = () => {
    setLoading(true);
    setError(false);
    fetchBookingStatuses([code])
      .then((rows) => setRecord(rows[0] ?? null))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStatus();
    // The booking number is the only input; reloading happens through the retry button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  if (!loading && !error && !record) {
    return (
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-20 text-center md:px-8">
        <h1 className="text-3xl font-bold text-maroon-800">{t({ en: 'Booking not found', hi: 'बुकिंग नहीं मिली' })}</h1>
        <p className="max-w-xl text-lg text-maroon-600">
          {t({ en: 'Please check the booking number and try again.', hi: 'कृपया बुकिंग नंबर जाँचें और फिर से कोशिश करें।' })}
        </p>
        <Link to="/my-booking" className="btn-primary">{t({ en: 'My Booking', hi: 'मेरी बुकिंग' })}</Link>
      </section>
    );
  }

  const status = record?.status ?? 'new';
  const items = record?.items ?? [];
  // The server's prices are the real ones; the saved copy is only a fallback while they load.
  const total = items.length > 0 ? items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0) : (saved?.totalAmount ?? 0);
  const dateLocale = language === 'hi' ? 'hi-IN' : 'en-IN';
  const createdAt = record?.created_at ?? saved?.createdAt;

  const summaryMessage = [
    `Booking No: ${code}`,
    `Status: ${STATUS_LABELS[status].en}`,
    ...items.map((item) => `- ${item.product_name} (${item.size}, ${item.colour}) x ${item.quantity} = ${formatRupees(item.unit_price * item.quantity)}`),
    `Total: ${formatRupees(total)}`,
    saved ? `Name: ${saved.customerName}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 md:px-8 md:py-16">
      <div className="print-hidden flex flex-col items-center gap-5 pb-10 text-center">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-maroon-700 text-gold-400 shadow-md">
          <CheckCircle2 className="h-10 w-10" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-bold text-maroon-800 md:text-3xl">{t(HEADLINES[status])}</h1>
      </div>

      <div id="booking-receipt" className="rounded-3xl bg-white p-6 shadow-card md:p-10">
        <div className="flex flex-col gap-6 border-b border-maroon-100 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-base text-maroon-500">{t({ en: 'Booking number', hi: 'बुकिंग नंबर' })}</p>
            <p className="font-mono text-2xl font-bold tracking-wider text-maroon-900" data-testid="booking-code">{code}</p>
          </div>
          <div className="flex flex-col gap-1 md:items-end">
            <p className="text-base text-maroon-500">{t({ en: 'Status', hi: 'स्थिति' })}</p>
            <span className="inline-flex w-fit rounded-full bg-cream-200 px-4 py-1 text-base font-medium text-maroon-800">
              {loading ? t({ en: 'Checking...', hi: 'जाँच हो रही है...' }) : t(STATUS_LABELS[status])}
            </span>
          </div>
        </div>

        {loading && <p className="py-6 text-lg text-maroon-600" role="status">{t({ en: 'Loading booking...', hi: 'बुकिंग लोड हो रही है...' })}</p>}

        {error && (
          <div role="alert" className="flex flex-col items-start gap-3 py-6">
            <p className="text-lg text-maroon-700">{t({ en: 'Could not load the latest status.', hi: 'नवीनतम स्थिति लोड नहीं हो सकी।' })}</p>
            <button type="button" onClick={loadStatus} className="btn-primary">
              <RefreshCw className="h-5 w-5" aria-hidden="true" />
              {t({ en: 'Try again', hi: 'फिर से कोशिश करें' })}
            </button>
          </div>
        )}

        {items.length > 0 && (
          <ul className="flex flex-col divide-y divide-maroon-100 py-6">
            {items.map((item, index) => (
              <li key={`${item.product_name}-${index}`} className="flex flex-wrap items-center justify-between gap-2 py-3 text-base">
                <span className="text-maroon-900">
                  {language === 'hi' && item.product_name_hi ? item.product_name_hi : item.product_name}
                  <span className="text-maroon-600"> · {item.size} · {item.colour} · x{item.quantity}</span>
                </span>
                <span className="font-medium text-maroon-800">{formatRupees(item.unit_price * item.quantity)}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between border-t border-maroon-100 pt-6 text-lg">
          <span className="text-maroon-800">{t({ en: 'Total', hi: 'कुल' })}</span>
          <span className="text-xl font-bold text-maroon-900">{formatRupees(total)}</span>
        </div>

        {saved && (
          <dl className="mt-6 grid gap-4 border-t border-maroon-100 pt-6 text-base md:grid-cols-2">
            <div><dt className="text-maroon-500">{t({ en: 'Name', hi: 'नाम' })}</dt><dd className="text-maroon-900">{saved.customerName}</dd></div>
            {createdAt && (
              <div><dt className="text-maroon-500">{t({ en: 'Date', hi: 'तारीख' })}</dt><dd className="text-maroon-900">{new Date(createdAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })}</dd></div>
            )}
          </dl>
        )}
      </div>

      <div className="print-hidden mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button type="button" onClick={copyCode} className="btn-primary flex-1">
          <Copy className="h-5 w-5" aria-hidden="true" />
          {copied ? t({ en: 'Copied', hi: 'कॉपी हो गया' }) : t({ en: 'Copy booking number', hi: 'बुकिंग नंबर कॉपी करें' })}
        </button>
        <button type="button" onClick={() => window.print()} className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-maroon-700 px-6 py-3 text-base font-medium text-maroon-700 transition hover:bg-maroon-50">
          <Printer className="h-5 w-5" aria-hidden="true" />
          {t({ en: 'Print receipt', hi: 'रसीद प्रिंट करें' })}
        </button>
        <a href={whatsappLink(summaryMessage)} target="_blank" rel="noopener noreferrer" className="btn-gold flex-1">
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
          {t({ en: 'Send summary on WhatsApp', hi: 'WhatsApp पर सारांश भेजें' })}
        </a>
      </div>

      <p className="print-hidden mt-6 text-center text-base">
        <Link to="/my-booking" className="font-medium text-maroon-700 underline-offset-4 hover:underline">
          {t({ en: 'View all my bookings', hi: 'मेरी सभी बुकिंग देखें' })}
        </Link>
      </p>
    </section>
  );
}

import { useEffect, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchBookingStatuses, type BookingStatus, type BookingStatusRecord } from '@/lib/booking-api';
import { formatRupees } from '@/lib/format';
import { useLanguage } from '@/lib/language';
import { loadSavedBookings, type SavedBooking } from '@/lib/saved-bookings';
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

export function MyBookingPage() {
  const { t, language } = useLanguage();
  const [saved] = useState<SavedBooking[]>(() => loadSavedBookings());
  const [statuses, setStatuses] = useState<Map<string, BookingStatusRecord>>(new Map());
  const [error, setError] = useState(false);
  const dateLocale = language === 'hi' ? 'hi-IN' : 'en-IN';

  useEffect(() => {
    if (saved.length === 0) return;
    let active = true;
    fetchBookingStatuses(saved.map((entry) => entry.code))
      .then((rows) => {
        if (active) setStatuses(new Map(rows.map((row) => [row.booking_code, row])));
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
    // Statuses are fetched once for the bookings saved when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (saved.length === 0) {
    return (
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-20 text-center md:px-8">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-maroon-700 text-gold-400 shadow-md">
          <CalendarCheck className="h-10 w-10" aria-hidden="true" />
        </span>
        <h1 className="text-3xl font-bold text-maroon-800 md:text-4xl">{t({ en: 'My Booking', hi: 'मेरी बुकिंग' })}</h1>
        <p className="max-w-xl text-lg leading-relaxed text-maroon-600">
          {t({
            en: 'You have no booking requests yet. Choose a piece you like and send a booking request.',
            hi: 'अभी आपकी कोई बुकिंग नहीं है। अपनी पसंद का कपड़ा चुनें और बुकिंग अनुरोध भेजें।',
          })}
        </p>
        <Link to="/all-stock" className="btn-primary">
          {t({ en: 'View All Clothes', hi: 'सभी कपड़े देखें' })}
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 md:px-8 md:py-16">
      <div className="flex flex-col gap-3 pb-10">
        <h1 className="text-3xl font-bold text-maroon-800 md:text-4xl">{t({ en: 'My Booking', hi: 'मेरी बुकिंग' })}</h1>
        <span className="h-1 w-16 rounded-full bg-gold-500" aria-hidden="true" />
        <p className="max-w-xl text-lg leading-relaxed text-maroon-600">
          {t({
            en: 'Your bookings made from this device. The shop owner will confirm each booking.',
            hi: 'इस डिवाइस से की गई आपकी बुकिंग। दुकान मालिक हर बुकिंग की पुष्टि करेंगे।',
          })}
        </p>
        {error && (
          <p role="alert" className="text-base text-red-700">
            {t({ en: 'Could not load the latest status. Please refresh the page.', hi: 'नवीनतम स्थिति लोड नहीं हो सकी। कृपया पेज रीफ़्रेश करें।' })}
          </p>
        )}
      </div>

      <ul className="flex flex-col gap-4">
        {saved.map((booking) => {
          const status = statuses.get(booking.code)?.status;
          return (
            <li key={booking.code} className="animate-fade-up">
              <Link
                to={`/booking/${booking.code}`}
                className="flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover md:flex-row md:items-center md:justify-between md:p-6"
              >
                <div className="flex flex-col gap-1">
                  <p className="font-mono text-lg font-bold tracking-wider text-maroon-900">{booking.code}</p>
                  <p className="text-base text-maroon-600">
                    {new Date(booking.createdAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}
                    {booking.items.reduce((sum, item) => sum + item.quantity, 0)} {t({ en: 'pieces', hi: 'कपड़े' })}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 md:justify-end">
                  <span className="rounded-full bg-cream-200 px-3 py-1 text-sm font-medium text-maroon-800">
                    {status ? t(STATUS_LABELS[status]) : t({ en: 'Checking...', hi: 'जाँच हो रही है...' })}
                  </span>
                  <span className="text-xl font-bold text-maroon-700">{formatRupees(booking.totalAmount)}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

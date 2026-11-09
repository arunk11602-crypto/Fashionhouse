import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Mail, MessageCircle, Phone, RefreshCw } from 'lucide-react';
import { whatsappLinkTo } from '@/data/shop';
import {
  fetchAdminBookings,
  NEXT_STATUSES,
  OPEN_STATUSES,
  updateBookingStatus,
  type AdminBooking,
} from '@/lib/admin-bookings';
import type { BookingStatus } from '@/lib/booking-api';
import { formatRupees } from '@/lib/format';
import { useLanguage } from '@/lib/language';
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

const ACTION_LABELS: Record<BookingStatus, Bilingual> = {
  new: { en: 'Mark new', hi: 'नई करें' },
  pending: { en: 'Mark pending', hi: 'लंबित करें' },
  confirmed: { en: 'Confirm', hi: 'पुष्टि करें' },
  ready: { en: 'Mark ready', hi: 'तैयार करें' },
  completed: { en: 'Complete (sold)', hi: 'पूरी करें (बिका)' },
  rejected: { en: 'Reject', hi: 'अस्वीकार करें' },
  cancelled: { en: 'Cancel', hi: 'रद्द करें' },
};

const CONFIRM_STATUSES: BookingStatus[] = ['rejected', 'cancelled', 'completed'];

const STATUS_TONE: Record<BookingStatus, string> = {
  new: 'bg-gold-300 text-maroon-900',
  pending: 'bg-cream-200 text-maroon-800',
  confirmed: 'bg-maroon-700 text-cream-50',
  ready: 'bg-maroon-700 text-cream-50',
  completed: 'bg-green-100 text-green-900',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-red-100 text-red-800',
};

type Filter = 'open' | 'all' | BookingStatus;

function describeError(cause: unknown, t: (text: Bilingual) => string): string {
  const message = cause instanceof Error ? cause.message : '';
  if (message.includes('booking_status_final')) {
    return t({
      en: 'This booking is already finished and cannot be changed.',
      hi: 'यह बुकिंग पहले ही पूरी हो चुकी है, इसे बदला नहीं जा सकता।',
    });
  }
  return t({ en: 'Could not update. Refresh and try again.', hi: 'अपडेट नहीं हो सका। रीफ़्रेश करके फिर कोशिश करें।' });
}

export function BookingManager() {
  const { t, language } = useLanguage();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('open');
  const [openId, setOpenId] = useState<string | null>(null);
  const [pending, setPending] = useState<{ id: string; status: BookingStatus } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    fetchAdminBookings()
      .then(setBookings)
      .catch((cause: unknown) => setLoadError(cause instanceof Error ? cause.message : 'Unknown error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    if (filter === 'all') return bookings;
    if (filter === 'open') return bookings.filter((booking) => OPEN_STATUSES.includes(booking.status));
    return bookings.filter((booking) => booking.status === filter);
  }, [bookings, filter]);

  const newCount = bookings.filter((booking) => booking.status === 'new').length;
  const locale = language === 'hi' ? 'hi-IN' : 'en-IN';

  const applyStatus = async (booking: AdminBooking, status: BookingStatus) => {
    setBusyId(booking.id);
    setActionError(null);
    setNotice(null);
    try {
      await updateBookingStatus(booking.id, status);
      setNotice(
        t({
          en: `Booking ${booking.code} is now ${STATUS_LABELS[status].en}.`,
          hi: `बुकिंग ${booking.code} अब "${STATUS_LABELS[status].hi}" है।`,
        }),
      );
      setPending(null);
      load();
    } catch (cause) {
      setActionError(describeError(cause, t));
    } finally {
      setBusyId(null);
    }
  };

  const requestStatus = (booking: AdminBooking, status: BookingStatus) => {
    if (CONFIRM_STATUSES.includes(status)) {
      setPending({ id: booking.id, status });
    } else {
      void applyStatus(booking, status);
    }
  };

  const filters: { key: Filter; label: Bilingual }[] = [
    { key: 'open', label: { en: 'Open', hi: 'चालू' } },
    { key: 'new', label: STATUS_LABELS.new },
    { key: 'pending', label: STATUS_LABELS.pending },
    { key: 'confirmed', label: STATUS_LABELS.confirmed },
    { key: 'ready', label: STATUS_LABELS.ready },
    { key: 'completed', label: STATUS_LABELS.completed },
    { key: 'rejected', label: STATUS_LABELS.rejected },
    { key: 'cancelled', label: STATUS_LABELS.cancelled },
    { key: 'all', label: { en: 'All', hi: 'सभी' } },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-maroon-800">{t({ en: 'Bookings', hi: 'बुकिंग' })}</h2>
          <p className="text-base text-maroon-600">
            {newCount > 0
              ? t({ en: `${newCount} new booking(s) waiting`, hi: `${newCount} नई बुकिंग इंतज़ार में` })
              : t({ en: 'No new bookings waiting', hi: 'कोई नई बुकिंग इंतज़ार में नहीं' })}
          </p>
        </div>
        <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-full border-2 border-maroon-700 px-5 py-2 text-base font-medium text-maroon-700 transition hover:bg-maroon-50 disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          {t({ en: 'Refresh', hi: 'रीफ़्रेश' })}
        </button>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label={t({ en: 'Filter bookings', hi: 'बुकिंग फ़िल्टर' })}>
        {filters.map((option) => (
          <button
            key={option.key}
            type="button"
            role="tab"
            aria-selected={filter === option.key}
            onClick={() => setFilter(option.key)}
            className={`rounded-full border px-4 py-1.5 text-base transition ${
              filter === option.key ? 'border-maroon-700 bg-maroon-700 text-cream-50' : 'border-maroon-200 bg-white text-maroon-800 hover:border-maroon-500'
            }`}
          >
            {t(option.label)}
          </button>
        ))}
      </div>

      {notice && <p role="status" className="rounded-2xl bg-green-50 px-5 py-3 text-base text-green-900">{notice}</p>}
      {actionError && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-base text-red-800">{actionError}</p>}
      {loadError && (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-base text-red-800">
          {t({ en: 'Could not load bookings.', hi: 'बुकिंग लोड नहीं हो सकीं।' })} {loadError}
        </p>
      )}

      {!loading && !loadError && visible.length === 0 && (
        <p className="rounded-3xl bg-white px-6 py-10 text-center text-lg text-maroon-600 shadow-card">
          {t({ en: 'No bookings here.', hi: 'यहाँ कोई बुकिंग नहीं है।' })}
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {visible.map((booking) => {
          const expanded = openId === booking.id;
          const next = NEXT_STATUSES[booking.status];
          const confirming = pending?.id === booking.id ? pending.status : null;
          const busy = busyId === booking.id;
          return (
            <li key={booking.id} className="rounded-3xl bg-white p-5 shadow-card md:p-6">
              <button
                type="button"
                onClick={() => setOpenId(expanded ? null : booking.id)}
                aria-expanded={expanded}
                className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
              >
                <span className="flex flex-col gap-1">
                  <span className="font-mono text-lg font-bold tracking-wider text-maroon-900">{booking.code}</span>
                  <span className="text-base text-maroon-600">
                    {booking.customerName} · {new Date(booking.createdAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_TONE[booking.status]}`}>{t(STATUS_LABELS[booking.status])}</span>
                  <span className="text-lg font-bold text-maroon-700">{formatRupees(booking.total)}</span>
                  {expanded ? <ChevronUp className="h-5 w-5" aria-hidden="true" /> : <ChevronDown className="h-5 w-5" aria-hidden="true" />}
                </span>
              </button>

              {expanded && (
                <div className="mt-5 flex flex-col gap-5 border-t border-maroon-100 pt-5">
                  <ul className="flex flex-col divide-y divide-maroon-100 text-base">
                    {booking.items.map((item, index) => (
                      <li key={`${item.productName}-${index}`} className="flex flex-wrap justify-between gap-2 py-2">
                        <span className="text-maroon-900">
                          {item.productName} <span className="text-maroon-600">· {item.size} · {item.colour} · x{item.quantity}</span>
                        </span>
                        <span className="font-medium text-maroon-800">{formatRupees(item.unitPrice * item.quantity)}</span>
                      </li>
                    ))}
                  </ul>

                  <dl className="grid gap-4 text-base md:grid-cols-2">
                    <div>
                      <dt className="text-maroon-500">{t({ en: 'Address', hi: 'पता' })}</dt>
                      <dd className="text-maroon-900">{booking.address}, {booking.city} - {booking.pinCode}</dd>
                    </div>
                    <div>
                      <dt className="text-maroon-500">{t({ en: 'Preferred contact', hi: 'पसंदीदा संपर्क' })}</dt>
                      <dd className="text-maroon-900">{booking.preferredContact}</dd>
                    </div>
                    {booking.note && (
                      <div className="md:col-span-2">
                        <dt className="text-maroon-500">{t({ en: 'Customer note', hi: 'ग्राहक का संदेश' })}</dt>
                        <dd className="whitespace-pre-wrap text-maroon-900">{booking.note}</dd>
                      </div>
                    )}
                  </dl>

                  <div className="flex flex-wrap gap-3">
                    <a href={`tel:+91${booking.mobile}`} className="inline-flex items-center gap-2 rounded-full border border-maroon-200 px-4 py-2 text-base text-maroon-800 transition hover:bg-maroon-50">
                      <Phone className="h-4 w-4" aria-hidden="true" /> {booking.mobile}
                    </a>
                    <a
                      href={whatsappLinkTo(booking.whatsappNumber, `Hello ${booking.customerName}, this is Fashion House about your booking ${booking.code}.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-maroon-200 px-4 py-2 text-base text-maroon-800 transition hover:bg-maroon-50"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp
                    </a>
                    {booking.email && (
                      <a href={`mailto:${booking.email}`} className="inline-flex items-center gap-2 rounded-full border border-maroon-200 px-4 py-2 text-base text-maroon-800 transition hover:bg-maroon-50">
                        <Mail className="h-4 w-4" aria-hidden="true" /> {booking.email}
                      </a>
                    )}
                  </div>

                  {next.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap gap-3">
                        {next.map((status) => (
                          <button
                            key={status}
                            type="button"
                            disabled={busy}
                            onClick={() => requestStatus(booking, status)}
                            className={`rounded-full px-5 py-2 text-base font-medium transition disabled:opacity-60 ${
                              status === 'rejected' || status === 'cancelled'
                                ? 'border-2 border-red-700 text-red-800 hover:bg-red-50'
                                : 'bg-maroon-700 text-cream-50 hover:bg-maroon-800'
                            }`}
                          >
                            {t(ACTION_LABELS[status])}
                          </button>
                        ))}
                      </div>
                      {confirming && (
                        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl bg-cream-200 px-4 py-3 text-base text-maroon-900">
                          <span>
                            {confirming === 'completed'
                              ? t({ en: 'Mark as sold? This cannot be undone.', hi: 'बिका हुआ मार्क करें? इसे वापस नहीं किया जा सकता।' })
                              : t({ en: 'The pieces will go back to stock and this cannot be undone. Continue?', hi: 'कपड़े वापस स्टॉक में चले जाएँगे और इसे पलटा नहीं जा सकता। आगे बढ़ें?' })}
                          </span>
                          <button type="button" disabled={busy} onClick={() => void applyStatus(booking, confirming)} className="rounded-full bg-maroon-700 px-4 py-1.5 font-medium text-cream-50 disabled:opacity-60">
                            {t({ en: 'Yes, continue', hi: 'हाँ, आगे बढ़ें' })}
                          </button>
                          <button type="button" onClick={() => setPending(null)} className="rounded-full border border-maroon-300 px-4 py-1.5 text-maroon-800">
                            {t({ en: 'No', hi: 'नहीं' })}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-base text-maroon-500">
                      {t({ en: 'This booking is finished and cannot be changed.', hi: 'यह बुकिंग पूरी हो चुकी है, इसे बदला नहीं जा सकता।' })}
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

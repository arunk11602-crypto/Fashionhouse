import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BookingForm, type BookingFormValues } from '@/components/booking/BookingForm';
import { BookingError, submitBookingRequest } from '@/lib/booking-api';
import { useBookingList, type BookingListItem, type SyncResult } from '@/lib/booking-list';
import { fetchVariantLive } from '@/lib/catalog';
import { formatRupees } from '@/lib/format';
import { useLanguage } from '@/lib/language';
import { saveBooking } from '@/lib/saved-bookings';

export function BookingPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, syncWithCatalog, clearList } = useBookingList();
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState(() => crypto.randomUUID());
  // Set after a dropped connection: the earlier attempt may have been saved and already used up the stock,
  // so the retry goes straight to the server, which returns the existing booking for the same id.
  const unsureRetry = useRef(false);

  useEffect(() => {
    if (items.length === 0) return;
    let active = true;
    fetchVariantLive(items.map((item) => item.variantId))
      .then((live) => {
        if (!active) return;
        const changes = syncWithCatalog(live);
        const message = describeSync(changes, t);
        if (message) setNotice(message);
      })
      .catch(() => {
        if (active) setNotice(t({ en: 'Could not check stock. Please try again.', hi: 'स्टॉक जाँच नहीं हो सका। कृपया फिर से कोशिश करें।' }));
      });
    return () => {
      active = false;
    };
    // Stock and prices are checked once when the page opens; later list changes are driven by the customer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmit = async (values: BookingFormValues) => {
    if (submitting || items.length === 0) return;
    setSubmitting(true);
    setNotice(null);

    try {
      if (!unsureRetry.current) {
        const live = await fetchVariantLive(items.map((item) => item.variantId));
        const changes = syncWithCatalog(live);
        const message = describeSync(changes, t);
        if (message) {
          setNotice(message);
          return;
        }
      }

      const code = await submitBookingRequest({
        submissionId,
        customerName: values.customerName.trim(),
        mobile: values.mobile.replace(/[\s-]/g, ''),
        whatsappNumber: values.whatsappNumber.replace(/[\s-]/g, ''),
        email: values.email.trim(),
        address: values.address.trim(),
        city: values.city.trim(),
        pinCode: values.pinCode.trim(),
        preferredContact: values.preferredContact,
        note: values.note.trim(),
        termsAccepted: values.termsAccepted,
        items: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
      });

      saveBooking({
        code,
        createdAt: new Date().toISOString(),
        customerName: values.customerName.trim(),
        totalAmount: total,
        items: items.map((item) => ({
          productName: t(item.productName),
          size: item.size,
          colour: item.colour,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });
      unsureRetry.current = false;
      clearList();
      navigate(`/booking/${code}`, { replace: true });
    } catch (cause) {
      // Only start a fresh submission when the server clearly refused this one. After a dropped
      // connection the request may already be saved, so retrying with the same id cannot create a duplicate.
      const definitive = !(cause instanceof BookingError) || cause.definitive;
      unsureRetry.current = !definitive;
      if (definitive) setSubmissionId(crypto.randomUUID());
      setNotice(describeSubmitError(cause, t));
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-20 text-center md:px-8">
        {notice && (
          <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-left text-base text-red-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>{notice}</p>
          </div>
        )}
        <h1 className="text-3xl font-bold text-maroon-800 md:text-4xl">{t({ en: 'Your booking list is empty', hi: 'आपकी बुकिंग सूची खाली है' })}</h1>
        <p className="max-w-xl text-lg leading-relaxed text-maroon-600">
          {t({ en: 'Choose a piece you like and add it to your booking list.', hi: 'अपनी पसंद का कपड़ा चुनें और बुकिंग सूची में जोड़ें।' })}
        </p>
        <Link to="/all-stock" className="btn-primary">{t({ en: 'View All Clothes', hi: 'सभी कपड़े देखें' })}</Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 md:px-8 md:py-16">
      <div className="flex flex-col gap-3 pb-10">
        <Link to="/all-stock" className="inline-flex w-fit items-center gap-2 text-base font-medium text-maroon-700 transition hover:text-maroon-900">
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          {t({ en: 'Continue browsing', hi: 'और कपड़े देखें' })}
        </Link>
        <h1 className="text-3xl font-bold text-maroon-800 md:text-4xl">{t({ en: 'Booking Request', hi: 'बुकिंग अनुरोध' })}</h1>
        <span className="h-1 w-16 rounded-full bg-gold-500" aria-hidden="true" />
        <p className="max-w-2xl text-lg leading-relaxed text-maroon-600">
          {t({
            en: 'Review your list, fill in your details and send the request. No payment is taken online.',
            hi: 'अपनी सूची देखें, विवरण भरें और अनुरोध भेजें। ऑनलाइन कोई भुगतान नहीं लिया जाता।',
          })}
        </p>
      </div>

      {notice && (
        <div role="alert" className="mb-8 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-base text-red-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>{notice}</p>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-maroon-800">{t({ en: 'Your list', hi: 'आपकी सूची' })}</h2>
          <ul className="flex flex-col gap-4">
            {items.map((item) => (
              <BookingLine
                key={item.variantId}
                item={item}
                onQuantity={(quantity) => updateQuantity(item.variantId, quantity)}
                onRemove={() => removeItem(item.variantId)}
              />
            ))}
          </ul>
          <div className="flex items-center justify-between rounded-2xl bg-cream-200 px-5 py-4 text-lg">
            <span className="text-maroon-800">
              {t({ en: `Total (${totalQuantity} pieces)`, hi: `कुल (${totalQuantity} कपड़े)` })}
            </span>
            <span className="text-xl font-bold text-maroon-900">{formatRupees(total)}</span>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-card md:p-8">
          <h2 className="pb-6 text-2xl font-bold text-maroon-800">{t({ en: 'Your details', hi: 'आपके विवरण' })}</h2>
          <BookingForm disabled={submitting} onSubmit={handleSubmit} />
        </div>
      </div>
    </section>
  );
}

function BookingLine({
  item,
  onQuantity,
  onRemove,
}: {
  item: BookingListItem;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  const { t } = useLanguage();
  const maxQuantity = Math.min(item.maxQuantity, item.available);

  return (
    <li className="flex gap-4 rounded-3xl bg-white p-4 shadow-card">
      {item.image && <img src={item.image} alt={t(item.productName)} className="h-28 w-20 shrink-0 rounded-2xl object-cover" />}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-medium text-maroon-900">{t(item.productName)}</h3>
          <p className="text-base text-maroon-600">
            {t({ en: 'Size', hi: 'साइज़' })}: {item.size} · {t({ en: 'Colour', hi: 'रंग' })}: {item.colour}
          </p>
          <p className="text-base font-medium text-maroon-700">{formatRupees(item.unitPrice * item.quantity)}</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-3 rounded-full border border-maroon-100 bg-white p-1">
            <button
              type="button"
              onClick={() => onQuantity(item.quantity - 1)}
              disabled={item.quantity <= item.minQuantity}
              aria-label={t({ en: 'Decrease quantity', hi: 'मात्रा घटाएँ' })}
              className="grid h-9 w-9 place-items-center rounded-full bg-maroon-50 text-maroon-800 disabled:opacity-40"
            >
              -
            </button>
            <span className="w-6 text-center font-medium text-maroon-900" aria-live="polite">{item.quantity}</span>
            <button
              type="button"
              onClick={() => onQuantity(item.quantity + 1)}
              disabled={item.quantity >= maxQuantity}
              aria-label={t({ en: 'Increase quantity', hi: 'मात्रा बढ़ाएँ' })}
              className="grid h-9 w-9 place-items-center rounded-full bg-maroon-50 text-maroon-800 disabled:opacity-40"
            >
              +
            </button>
          </div>
          <button type="button" onClick={onRemove} className="inline-flex items-center gap-2 text-base font-medium text-maroon-700 transition hover:text-red-700">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {t({ en: 'Remove', hi: 'हटाएँ' })}
          </button>
        </div>
      </div>
    </li>
  );
}

type Translate = (text: { en: string; hi: string }) => string;

function describeSync(changes: SyncResult, t: Translate): string | null {
  const parts: string[] = [];
  if (changes.removed.length > 0) {
    const names = changes.removed.map((item) => t(item.productName)).join(', ');
    parts.push(
      t({
        en: `No longer available and removed from your list: ${names}.`,
        hi: `अब उपलब्ध नहीं होने से सूची से हटाया गया: ${names}।`,
      }),
    );
  }
  if (changes.adjusted.length > 0) {
    const names = changes.adjusted.map((item) => t(item.productName)).join(', ');
    parts.push(
      t({
        en: `Quantity updated to what is available: ${names}.`,
        hi: `उपलब्ध मात्रा के अनुसार बदली गई: ${names}।`,
      }),
    );
  }
  if (changes.repriced.length > 0) {
    const names = changes.repriced.map((item) => t(item.productName)).join(', ');
    parts.push(
      t({
        en: `Price changed: ${names}. Your total has been updated.`,
        hi: `कीमत बदली है: ${names}। आपका कुल अपडेट कर दिया गया है।`,
      }),
    );
  }
  if (parts.length === 0) return null;
  parts.push(t({ en: 'Please review your list and submit again.', hi: 'कृपया अपनी सूची जाँचकर फिर से भेजें।' }));
  return parts.join(' ');
}

function describeSubmitError(cause: unknown, t: Translate): string {
  const reason = cause instanceof BookingError ? cause.reason : '';
  if (cause instanceof BookingError && !cause.definitive) {
    return t({
      en: 'The connection was interrupted, so we are not sure the request was sent. Press Submit again: it will not create a duplicate booking.',
      hi: 'कनेक्शन टूट गया, इसलिए पक्का नहीं है कि अनुरोध गया या नहीं। फिर से "भेजें" दबाएँ: इससे दोहरी बुकिंग नहीं बनेगी।',
    });
  }
  if (reason === 'insufficient_stock' || reason === 'variant_not_bookable' || reason === 'variant_not_found') {
    return t({
      en: 'Some pieces are no longer available in the quantity you chose. Please review your list.',
      hi: 'कुछ कपड़े अब आपकी चुनी हुई मात्रा में उपलब्ध नहीं हैं। कृपया अपनी सूची जाँचें।',
    });
  }
  if (reason === 'invalid_quantity') {
    return t({
      en: 'One of the quantities is outside the allowed limit for that piece. Please review your list.',
      hi: 'किसी कपड़े की मात्रा तय सीमा से बाहर है। कृपया अपनी सूची जाँचें।',
    });
  }
  if (reason === 'too_many_requests') {
    return t({
      en: 'Too many booking requests from this number. Please wait for the shop to confirm your earlier requests, or call us.',
      hi: 'इस नंबर से बहुत ज़्यादा बुकिंग अनुरोध हो गए हैं। कृपया पिछले अनुरोधों की पुष्टि का इंतज़ार करें या हमें कॉल करें।',
    });
  }
  return t({
    en: 'Your request could not be sent. Please check your details and try again.',
    hi: 'आपका अनुरोध नहीं भेजा जा सका। कृपया विवरण जाँचें और फिर से कोशिश करें।',
  });
}

import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, Minus, Plus, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatRupees } from '@/lib/format';
import { useBookingList } from '@/lib/booking-list';
import { useLanguage } from '@/lib/language';
import type { Product, ProductVariant } from '@/types/catalog';

export function BookingModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { t } = useLanguage();
  const { addItem } = useBookingList();

  const colours = useMemo(() => [...new Set(product.variants.map((variant) => variant.colour))], [product.variants]);
  const firstAvailable = product.variants.find((variant) => variant.availableQuantity > 0) ?? product.variants[0];
  const [colour, setColour] = useState(firstAvailable?.colour ?? '');
  const [variantId, setVariantId] = useState(firstAvailable?.id ?? '');
  const [quantity, setQuantity] = useState(product.minQuantity);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const sizesForColour = product.variants.filter((variant) => variant.colour === colour);
  const selected: ProductVariant | undefined = product.variants.find((variant) => variant.id === variantId);
  const minQuantity = product.minQuantity;
  const maxQuantity = Math.min(product.maxQuantity, selected?.availableQuantity ?? 0);
  const canBook = Boolean(selected) && maxQuantity >= minQuantity;
  const safeQuantity = Math.max(minQuantity, Math.min(quantity, Math.max(maxQuantity, minQuantity)));
  const unitPrice = product.salePrice ?? product.price;
  const productName = t(product.name);

  const chooseColour = (nextColour: string) => {
    setColour(nextColour);
    const nextVariant =
      product.variants.find((variant) => variant.colour === nextColour && variant.availableQuantity > 0) ??
      product.variants.find((variant) => variant.colour === nextColour);
    setVariantId(nextVariant?.id ?? '');
    setQuantity(minQuantity);
  };

  const handleAdd = () => {
    if (!selected || !canBook) return;
    addItem({
      variantId: selected.id,
      productId: product.id,
      productName: product.name,
      image: product.image,
      size: selected.size,
      colour: selected.colour,
      quantity: safeQuantity,
      unitPrice,
      available: selected.availableQuantity,
      minQuantity: product.minQuantity,
      maxQuantity: product.maxQuantity,
    });
    setAdded(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-maroon-900/60 p-0 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-dialog-title"
        onClick={(event) => event.stopPropagation()}
        className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-cream-50 p-6 shadow-2xl animate-fade-up sm:max-w-lg sm:rounded-3xl md:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t({ en: 'Close', hi: 'बंद करें' })}
          className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white text-maroon-800 shadow-sm transition hover:bg-maroon-50"
        >
          <X className="h-5 w-5" />
        </button>

        {added ? (
          <div className="flex flex-col items-center gap-6 py-6 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-maroon-700 text-gold-400">
              <CalendarCheck className="h-8 w-8" />
            </span>
            <div className="flex flex-col gap-2">
              <h2 id="booking-dialog-title" className="text-2xl font-bold text-maroon-800">
                {t({ en: 'Added to your booking list', hi: 'आपकी बुकिंग सूची में जोड़ दिया गया' })}
              </h2>
              <p className="text-lg text-maroon-700">
                {t({
                  en: 'Review your list and send the booking request when you are ready. No payment is needed now.',
                  hi: 'सूची देखें और तैयार होने पर बुकिंग अनुरोध भेजें। अभी कोई भुगतान नहीं करना है।',
                })}
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <Link to="/booking" onClick={onClose} className="btn-primary flex-1 px-4 py-3 text-base">
                {t({ en: 'Review booking list', hi: 'बुकिंग सूची देखें' })}
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border-2 border-maroon-700 px-4 py-3 text-base font-medium text-maroon-700 transition hover:bg-maroon-50"
              >
                {t({ en: 'Continue browsing', hi: 'और देखें' })}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1 pr-12">
              <p className="text-base font-medium text-gold-700">{t({ en: 'Add to booking', hi: 'बुकिंग में जोड़ें' })}</p>
              <h2 id="booking-dialog-title" className="text-2xl font-bold text-maroon-800">
                {productName}
              </h2>
              <p className="text-lg font-medium text-maroon-700">{formatRupees(unitPrice)}</p>
            </div>

            <div>
              <span className="label">{t({ en: 'Colour', hi: 'रंग' })}</span>
              <div className="flex flex-wrap gap-2">
                {colours.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => chooseColour(option)}
                    aria-pressed={option === colour}
                    className={`rounded-full border px-4 py-2 text-base transition ${
                      option === colour
                        ? 'border-maroon-700 bg-maroon-700 text-cream-50'
                        : 'border-maroon-200 bg-white text-maroon-800 hover:border-maroon-500'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="label">{t({ en: 'Size', hi: 'साइज़' })}</span>
              <div className="flex flex-wrap gap-2">
                {sizesForColour.map((variant) => {
                  const soldOut = variant.availableQuantity === 0;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      disabled={soldOut}
                      onClick={() => {
                        setVariantId(variant.id);
                        setQuantity(minQuantity);
                      }}
                      aria-pressed={variant.id === variantId}
                      className={`min-w-14 rounded-full border px-4 py-2 text-base transition disabled:cursor-not-allowed disabled:line-through disabled:opacity-40 ${
                        variant.id === variantId
                          ? 'border-maroon-700 bg-maroon-700 text-cream-50'
                          : 'border-maroon-200 bg-white text-maroon-800 hover:border-maroon-500'
                      }`}
                    >
                      {variant.size}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="label">{t({ en: 'Quantity', hi: 'मात्रा' })}</span>
              <div className="flex flex-wrap items-center gap-4">
                <div className="inline-flex items-center gap-4 rounded-full border border-maroon-100 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(minQuantity, safeQuantity - 1))}
                    disabled={safeQuantity <= minQuantity}
                    aria-label={t({ en: 'Decrease quantity', hi: 'मात्रा घटाएँ' })}
                    className="grid h-11 w-11 place-items-center rounded-full bg-maroon-50 text-maroon-800 transition hover:bg-maroon-100 disabled:opacity-40"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <span className="w-8 text-center text-xl font-medium text-maroon-900" aria-live="polite">
                    {safeQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(maxQuantity, safeQuantity + 1))}
                    disabled={safeQuantity >= maxQuantity || !canBook}
                    aria-label={t({ en: 'Increase quantity', hi: 'मात्रा बढ़ाएँ' })}
                    className="grid h-11 w-11 place-items-center rounded-full bg-maroon-50 text-maroon-800 transition hover:bg-maroon-100 disabled:opacity-40"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                {selected && (
                  <p className="text-base text-maroon-600">
                    {t({
                      en: `${selected.availableQuantity} available`,
                      hi: `${selected.availableQuantity} उपलब्ध`,
                    })}
                    {(minQuantity > 1 || product.maxQuantity < 10) &&
                      t({
                        en: ` · order ${minQuantity} to ${product.maxQuantity}`,
                        hi: ` · ${minQuantity} से ${product.maxQuantity} तक`,
                      })}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-cream-200 px-4 py-3 text-lg">
              <span className="text-maroon-800">{t({ en: 'Estimated total', hi: 'अनुमानित कुल' })}</span>
              <span className="font-bold text-maroon-900">{formatRupees(unitPrice * safeQuantity)}</span>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={!canBook}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {selected && !canBook
                ? t({ en: 'Out of Stock', hi: 'स्टॉक खत्म' })
                : t({ en: 'Add to booking list', hi: 'बुकिंग सूची में जोड़ें' })}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

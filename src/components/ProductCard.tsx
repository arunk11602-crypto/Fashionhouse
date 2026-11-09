import { useState, type ReactNode } from 'react';
import { ShoppingBag, Tag } from 'lucide-react';
import { BookingModal } from '@/components/BookingModal';
import { totalAvailable } from '@/lib/catalog';
import { formatRupees } from '@/lib/format';
import { useLanguage } from '@/lib/language';
import type { Product } from '@/types/catalog';

export function ProductCard({ product }: { product: Product }) {
  const { t } = useLanguage();
  const [bookingOpen, setBookingOpen] = useState(false);
  const name = t(product.name);
  const hasSale = product.salePrice !== undefined;
  const displayPrice = product.salePrice ?? product.price;
  const comingSoon = product.status === 'Coming Soon';
  const soldOut = product.status === 'Sold Out' || product.status === 'Booked';
  const outOfStock = !comingSoon && !soldOut && totalAvailable(product) === 0;
  const bookable = !comingSoon && !soldOut && !outOfStock;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-card transition duration-500 hover:-translate-y-1 hover:shadow-card-hover">
      <div className="relative aspect-[3/4] overflow-hidden bg-cream-200">
        <img
          src={product.image}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Badge>{product.stockType === 'new' ? t({ en: 'New', hi: 'नया' }) : t({ en: 'Old', hi: 'पुराना' })}</Badge>
          {hasSale && <Badge tone="gold">{t({ en: 'Sale', hi: 'सेल' })}</Badge>}
          {product.isFinal && <Badge tone="dark">{t({ en: 'Final', hi: 'फाइनल' })}</Badge>}
          {(outOfStock || soldOut) && <Badge tone="dark">{soldOut ? t({ en: 'Sold Out', hi: 'बिक गया' }) : t({ en: 'Out of Stock', hi: 'स्टॉक खत्म' })}</Badge>}
          {comingSoon && <Badge tone="gold">{t({ en: 'Coming Soon', hi: 'जल्द आ रहा है' })}</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 md:p-5">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-medium leading-snug text-maroon-900 md:text-xl">{name}</h3>
          <p className="text-base text-maroon-500">{t(product.fabric)}</p>
        </div>

        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-xl font-bold text-maroon-700 md:text-2xl">
            {formatRupees(displayPrice)}
          </span>
          {hasSale && (
            <span className="text-base text-maroon-400 line-through">{formatRupees(product.price)}</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setBookingOpen(true)}
          disabled={!bookable}
          className="btn-primary mt-auto w-full px-4 py-3 text-base disabled:cursor-not-allowed disabled:opacity-60 md:text-lg"
        >
          <ShoppingBag className="h-5 w-5" aria-hidden="true" />
          {soldOut
            ? t({ en: 'Sold Out', hi: 'बिक गया' })
            : outOfStock
              ? t({ en: 'Out of Stock', hi: 'स्टॉक खत्म' })
              : comingSoon
              ? t({ en: 'Coming Soon', hi: 'जल्द आ रहा है' })
              : t({ en: 'Add to booking', hi: 'बुकिंग में जोड़ें' })}
        </button>
      </div>

      {bookingOpen && bookable && <BookingModal product={product} onClose={() => setBookingOpen(false)} />}
    </article>
  );
}

interface BadgeProps {
  tone?: 'light' | 'gold' | 'dark';
  children: ReactNode;
}

function Badge({ tone = 'light', children }: BadgeProps) {
  const toneClass = {
    light: 'bg-white/95 text-maroon-800',
    gold: 'bg-gold-500 text-maroon-900',
    dark: 'bg-maroon-800 text-cream-50',
  }[tone];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium shadow-sm ${toneClass}`}>
      {tone === 'gold' && <Tag className="h-3.5 w-3.5" aria-hidden="true" />}
      {children}
    </span>
  );
}

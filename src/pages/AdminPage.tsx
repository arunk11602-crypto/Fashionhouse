import { useState } from 'react';
import { LogOut, ShieldAlert } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { BookingManager } from '@/components/admin/BookingManager';
import { FlashNewsManager } from '@/components/admin/FlashNewsManager';
import { StockManager } from '@/components/admin/StockManager';
import { useAdminSession } from '@/lib/admin-session';
import { useLanguage } from '@/lib/language';
import type { Bilingual } from '@/types/catalog';

type Tab = 'bookings' | 'stock' | 'news';

const TABS: { key: Tab; label: Bilingual }[] = [
  { key: 'bookings', label: { en: 'Bookings', hi: 'बुकिंग' } },
  { key: 'stock', label: { en: 'Stock', hi: 'स्टॉक' } },
  { key: 'news', label: { en: 'Flash News', hi: 'फ्लैश न्यूज़' } },
];

export function AdminPage() {
  const { t } = useLanguage();
  const { status, signOut } = useAdminSession();
  const [tab, setTab] = useState<Tab>('bookings');

  if (status === 'loading') {
    return (
      <section className="flex min-h-[70vh] items-center justify-center px-4 py-16">
        <p role="status" className="text-lg text-maroon-600">
          {t({ en: 'Checking access...', hi: 'पहुँच जाँची जा रही है...' })}
        </p>
      </section>
    );
  }

  if (status === 'signed-out') return <Navigate to="/admin-login" replace />;

  if (status === 'not-admin') {
    return (
      <section className="flex min-h-[70vh] items-center justify-center px-4 py-16">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-3xl bg-white p-8 text-center shadow-card">
          <ShieldAlert className="h-10 w-10 text-red-700" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-maroon-800">
            {t({ en: 'Access not allowed', hi: 'पहुँच की अनुमति नहीं' })}
          </h1>
          <p className="text-base text-maroon-600">
            {t({
              en: 'This account is not registered as the shop admin.',
              hi: 'यह खाता दुकान एडमिन के रूप में दर्ज नहीं है।',
            })}
          </p>
          <button type="button" className="btn-outline" onClick={() => signOut()}>
            {t({ en: 'Sign out', hi: 'लॉगआउट करें' })}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-10 md:px-8 md:py-14">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-gold-600">
              {t({ en: 'Shop dashboard', hi: 'दुकान डैशबोर्ड' })}
            </p>
            <h1 className="text-3xl font-bold text-maroon-800">{t({ en: 'Admin', hi: 'एडमिन' })}</h1>
          </div>
          <button type="button" className="btn-outline self-start sm:self-auto" onClick={() => signOut()}>
            <LogOut className="h-5 w-5" aria-hidden="true" />
            {t({ en: 'Sign out', hi: 'लॉगआउट करें' })}
          </button>
        </div>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t({ en: 'Admin sections', hi: 'एडमिन अनुभाग' })}>
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              onClick={() => setTab(item.key)}
              className={`rounded-full border px-5 py-2 text-lg font-medium transition ${
                tab === item.key ? 'border-maroon-700 bg-maroon-700 text-cream-50' : 'border-maroon-200 bg-white text-maroon-800 hover:border-maroon-500'
              }`}
            >
              {t(item.label)}
            </button>
          ))}
        </div>
        {tab === 'bookings' && <BookingManager />}
        {tab === 'stock' && <StockManager />}
        {tab === 'news' && <FlashNewsManager />}
      </div>
    </section>
  );
}

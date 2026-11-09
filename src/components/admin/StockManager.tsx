import { useCallback, useEffect, useMemo, useState } from 'react';
import { Archive, ChevronDown, ChevronUp, Eye, EyeOff, RefreshCw, Search } from 'lucide-react';
import {
  fetchAdminProducts,
  MANUAL_STATUSES,
  setVariantAvailable,
  updateProductFlags,
  type AdminProduct,
  type AdminVariant,
  type ManualStatus,
} from '@/lib/admin-stock';
import { useLanguage } from '@/lib/language';
import type { Bilingual } from '@/types/catalog';

const STATUS_LABELS: Record<ManualStatus, Bilingual> = {
  'In Stock': { en: 'Automatic (from stock)', hi: 'अपने-आप (स्टॉक से)' },
  'Coming Soon': { en: 'Coming Soon', hi: 'जल्द आ रहा है' },
  'Sold Out': { en: 'Sold Out', hi: 'बिक गया' },
  'Final Pieces': { en: 'Final Pieces', hi: 'आखिरी कपड़े' },
};

function manualStatus(status: string): ManualStatus {
  return (MANUAL_STATUSES as string[]).includes(status) ? (status as ManualStatus) : 'In Stock';
}

export function StockManager() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    fetchAdminProducts()
      .then(setProducts)
      .catch((cause: unknown) => setLoadError(cause instanceof Error ? cause.message : 'Unknown error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return products;
    return products.filter((product) => `${product.name} ${product.sku}`.toLowerCase().includes(needle));
  }, [products, query]);

  const run = async (id: string, action: () => Promise<void>, success: Bilingual) => {
    setBusyId(id);
    setActionError(null);
    setNotice(null);
    try {
      await action();
      setNotice(t(success));
      load();
    } catch {
      setActionError(t({ en: 'Could not save. Refresh and try again.', hi: 'सेव नहीं हो सका। रीफ़्रेश करके फिर कोशिश करें।' }));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-maroon-800">{t({ en: 'Stock', hi: 'स्टॉक' })}</h2>
          <p className="text-base text-maroon-600">
            {t({
              en: 'Change available pieces, show or hide a product, or set a special status.',
              hi: 'उपलब्ध कपड़े बदलें, प्रोडक्ट दिखाएँ या छिपाएँ, या खास स्थिति चुनें।',
            })}
          </p>
        </div>
        <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-full border-2 border-maroon-700 px-5 py-2 text-base font-medium text-maroon-700 transition hover:bg-maroon-50 disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          {t({ en: 'Refresh', hi: 'रीफ़्रेश' })}
        </button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-maroon-400" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label={t({ en: 'Search products', hi: 'प्रोडक्ट खोजें' })}
          placeholder={t({ en: 'Search by name or code', hi: 'नाम या कोड से खोजें' })}
          className="field pl-12"
        />
      </div>

      {notice && <p role="status" className="rounded-2xl bg-green-50 px-5 py-3 text-base text-green-900">{notice}</p>}
      {actionError && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-base text-red-800">{actionError}</p>}
      {loadError && (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-base text-red-800">
          {t({ en: 'Could not load products.', hi: 'प्रोडक्ट लोड नहीं हो सके।' })} {loadError}
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {visible.map((product) => {
          const expanded = openId === product.id;
          const busy = busyId === product.id;
          const available = product.variants.reduce((sum, variant) => sum + variant.available, 0);
          return (
            <li key={product.id} className={`rounded-3xl bg-white p-5 shadow-card md:p-6 ${product.isArchived ? 'opacity-70' : ''}`}>
              <button type="button" onClick={() => setOpenId(expanded ? null : product.id)} aria-expanded={expanded} className="flex w-full flex-wrap items-center justify-between gap-3 text-left">
                <span className="flex flex-col gap-1">
                  <span className="text-lg font-medium text-maroon-900">{product.name}</span>
                  <span className="text-base text-maroon-600">
                    {product.sku} · {product.status}
                    {product.isDemo && ` · ${t({ en: 'Demo', hi: 'डेमो' })}`}
                    {!product.isPublished && ` · ${t({ en: 'Hidden', hi: 'छिपा हुआ' })}`}
                    {product.isArchived && ` · ${t({ en: 'Archived', hi: 'आर्काइव' })}`}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-lg font-bold text-maroon-700">{available} {t({ en: 'available', hi: 'उपलब्ध' })}</span>
                  {expanded ? <ChevronUp className="h-5 w-5" aria-hidden="true" /> : <ChevronDown className="h-5 w-5" aria-hidden="true" />}
                </span>
              </button>

              {expanded && (
                <div className="mt-5 flex flex-col gap-5 border-t border-maroon-100 pt-5">
                  <div className="flex flex-wrap items-end gap-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        run(
                          product.id,
                          () => updateProductFlags(product.id, { isPublished: !product.isPublished }),
                          product.isPublished ? { en: 'Product hidden from the shop.', hi: 'प्रोडक्ट दुकान से छिपा दिया गया।' } : { en: 'Product is now visible.', hi: 'प्रोडक्ट अब दिख रहा है।' },
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-full border border-maroon-200 px-4 py-2 text-base text-maroon-800 transition hover:bg-maroon-50 disabled:opacity-60"
                    >
                      {product.isPublished ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                      {product.isPublished ? t({ en: 'Hide', hi: 'छिपाएँ' }) : t({ en: 'Show', hi: 'दिखाएँ' })}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        run(
                          product.id,
                          () => updateProductFlags(product.id, { isArchived: !product.isArchived }),
                          product.isArchived ? { en: 'Product restored.', hi: 'प्रोडक्ट वापस लाया गया।' } : { en: 'Product archived.', hi: 'प्रोडक्ट आर्काइव हो गया।' },
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-full border border-maroon-200 px-4 py-2 text-base text-maroon-800 transition hover:bg-maroon-50 disabled:opacity-60"
                    >
                      <Archive className="h-4 w-4" aria-hidden="true" />
                      {product.isArchived ? t({ en: 'Restore', hi: 'वापस लाएँ' }) : t({ en: 'Archive', hi: 'आर्काइव' })}
                    </button>
                    <div>
                      <label htmlFor={`status-${product.id}`} className="label">{t({ en: 'Status', hi: 'स्थिति' })}</label>
                      <select
                        id={`status-${product.id}`}
                        className="field py-2 text-base"
                        disabled={busy}
                        value={manualStatus(product.status)}
                        onChange={(event) =>
                          run(product.id, () => updateProductFlags(product.id, { status: event.target.value as ManualStatus }), { en: 'Status updated.', hi: 'स्थिति अपडेट हो गई।' })
                        }
                      >
                        {MANUAL_STATUSES.map((status) => (
                          <option key={status} value={status}>{t(STATUS_LABELS[status])}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <ul className="flex flex-col divide-y divide-maroon-100">
                    {product.variants.map((variant) => (
                      <VariantRow
                        key={variant.id}
                        variant={variant}
                        disabled={busy}
                        onSave={(value) =>
                          run(product.id, () => setVariantAvailable(variant.id, value), { en: 'Stock saved.', hi: 'स्टॉक सेव हो गया।' })
                        }
                      />
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function VariantRow({ variant, disabled, onSave }: { variant: AdminVariant; disabled: boolean; onSave: (value: number) => void }) {
  const { t } = useLanguage();
  const [value, setValue] = useState(String(variant.available));
  const parsed = Number(value);
  const valid = value.trim() !== '' && Number.isInteger(parsed) && parsed >= 0 && parsed <= 100000;
  const changed = valid && parsed !== variant.available;

  useEffect(() => {
    setValue(String(variant.available));
  }, [variant.available]);

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <span className="text-base text-maroon-900">
        {variant.size} · {variant.colour}
        <span className="block text-sm text-maroon-500">
          {t({ en: 'Booked', hi: 'बुक' })}: {variant.booked} · {t({ en: 'Sold', hi: 'बिका' })}: {variant.sold}
        </span>
      </span>
      <span className="flex items-center gap-2">
        <label htmlFor={`avail-${variant.id}`} className="sr-only">{t({ en: 'Available pieces', hi: 'उपलब्ध कपड़े' })}</label>
        <input
          id={`avail-${variant.id}`}
          type="number"
          min={0}
          max={100000}
          inputMode="numeric"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="field w-28 py-2 text-base"
          aria-invalid={!valid}
        />
        <button type="button" disabled={disabled || !changed} onClick={() => onSave(parsed)} className="btn-primary px-5 py-2 text-base">
          {t({ en: 'Save', hi: 'सेव' })}
        </button>
      </span>
    </li>
  );
}

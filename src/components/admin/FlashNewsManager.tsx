import { useCallback, useEffect, useState } from 'react';
import { Pencil, Pin, PinOff, Plus, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { FlashNewsForm } from '@/components/admin/FlashNewsForm';
import {
  deleteFlashNews,
  fetchFlashNews,
  isFlashNewsLive,
  setFlashNewsFlags,
  type FlashNews,
} from '@/lib/flash-news';
import { useLanguage } from '@/lib/language';
import type { Bilingual } from '@/types/catalog';

type Panel = { mode: 'closed' } | { mode: 'add' } | { mode: 'edit'; item: FlashNews };

function statusLabel(item: FlashNews, now: number): Bilingual {
  if (!item.isActive) return { en: 'Inactive', hi: 'निष्क्रिय' };
  if (item.startsAt && Date.parse(item.startsAt) > now) return { en: 'Scheduled', hi: 'निर्धारित' };
  if (item.endsAt && Date.parse(item.endsAt) <= now) return { en: 'Expired', hi: 'समाप्त' };
  return isFlashNewsLive(item, now) ? { en: 'Live', hi: 'लाइव' } : { en: 'Inactive', hi: 'निष्क्रिय' };
}

function formatDate(iso: string | null, language: 'en' | 'hi'): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function FlashNewsManager() {
  const { t, language } = useLanguage();
  const [items, setItems] = useState<FlashNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>({ mode: 'closed' });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    fetchFlashNews()
      .then(setItems)
      .catch((cause: unknown) => setLoadError(cause instanceof Error ? cause.message : 'Unknown error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaved = (message: string) => {
    setPanel({ mode: 'closed' });
    setNotice(message);
    setActionError(null);
    load();
  };

  const toggleFlag = async (item: FlashNews, flags: { isActive?: boolean; isPinned?: boolean }) => {
    setBusyId(item.id);
    setActionError(null);
    try {
      await setFlashNewsFlags(item.id, flags);
      setNotice(
        flags.isPinned !== undefined
          ? t(
              flags.isPinned
                ? { en: 'News pinned to the front.', hi: 'समाचार सबसे आगे पिन किया गया।' }
                : { en: 'News unpinned.', hi: 'समाचार का पिन हटाया गया।' },
            )
          : t(
              flags.isActive
                ? { en: 'News is now active.', hi: 'समाचार अब सक्रिय है।' }
                : { en: 'News is now inactive.', hi: 'समाचार अब निष्क्रिय है।' },
            ),
      );
      load();
    } catch {
      setActionError(t({ en: 'Could not update. Try again.', hi: 'अपडेट नहीं हो सका। फिर से कोशिश करें।' }));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item: FlashNews) => {
    setBusyId(item.id);
    setActionError(null);
    try {
      await deleteFlashNews(item.id);
      setConfirmDeleteId(null);
      setNotice(t({ en: 'News deleted.', hi: 'समाचार हटा दिया गया।' }));
      load();
    } catch {
      setActionError(t({ en: 'Could not delete. Try again.', hi: 'हटाया नहीं जा सका। फिर से कोशिश करें।' }));
    } finally {
      setBusyId(null);
    }
  };

  const now = Date.now();

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-maroon-800">{t({ en: 'Flash News', hi: 'फ्लैश न्यूज़' })}</h2>
          <p className="text-base text-maroon-600">
            {t({
              en: 'Shown as a scrolling ticker on the home page while active and inside its dates.',
              hi: 'सक्रिय होने और तारीख के भीतर होने पर होमपेज पर स्क्रॉल होती है।',
            })}
          </p>
        </div>
        {panel.mode === 'closed' && (
          <button type="button" className="btn-primary self-start sm:self-auto" onClick={() => setPanel({ mode: 'add' })}>
            <Plus className="h-5 w-5" aria-hidden="true" />
            {t({ en: 'Add news', hi: 'समाचार जोड़ें' })}
          </button>
        )}
      </div>

      {notice && (
        <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-base text-emerald-800">
          {notice}
        </p>
      )}
      {actionError && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-base text-red-800">
          {actionError}
        </p>
      )}

      {panel.mode !== 'closed' && (
        <div className="rounded-2xl bg-white p-5 shadow-card md:p-8">
          <h3 className="mb-6 text-xl font-semibold text-maroon-800">
            {panel.mode === 'add'
              ? t({ en: 'New flash news', hi: 'नया फ्लैश न्यूज़' })
              : t({ en: 'Edit flash news', hi: 'फ्लैश न्यूज़ बदलें' })}
          </h3>
          <FlashNewsForm
            key={panel.mode === 'edit' ? panel.item.id : 'new'}
            initial={panel.mode === 'edit' ? panel.item : null}
            onCancel={() => setPanel({ mode: 'closed' })}
            onSaved={handleSaved}
          />
        </div>
      )}

      {loading && (
        <p role="status" className="py-10 text-center text-lg text-maroon-600">
          {t({ en: 'Loading news...', hi: 'समाचार लोड हो रहे हैं...' })}
        </p>
      )}

      {!loading && loadError && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl bg-red-50 p-6 text-red-800">
          <p className="text-lg font-semibold">
            {t({ en: 'Could not load flash news.', hi: 'फ्लैश न्यूज़ लोड नहीं हो सकी।' })}
          </p>
          <button type="button" className="btn-outline" onClick={load}>
            {t({ en: 'Try again', hi: 'फिर से कोशिश करें' })}
          </button>
        </div>
      )}

      {!loading && !loadError && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-maroon-200 bg-white p-10 text-center">
          <p className="text-lg text-maroon-700">
            {t({ en: 'No flash news yet. Add your first update.', hi: 'अभी कोई फ्लैश न्यूज़ नहीं है। पहला अपडेट जोड़ें।' })}
          </p>
        </div>
      )}

      {!loading && !loadError && items.length > 0 && (
        <ul className="flex flex-col gap-4">
          {items.map((item) => {
            const status = statusLabel(item, now);
            const busy = busyId === item.id;
            return (
              <li
                key={item.id}
                className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-card md:flex-row md:items-center md:justify-between"
              >
                <div className="flex min-w-0 flex-col gap-3">
                  <div
                    className="inline-flex max-w-full items-center rounded-lg px-3 py-2 text-base font-semibold"
                    style={{ color: item.textColor, backgroundColor: item.backgroundColor }}
                  >
                    <span className="truncate">{t(item.text)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-maroon-700">
                    <span className="rounded-full bg-cream-100 px-3 py-1 font-semibold">{t(status)}</span>
                    {item.isPinned && (
                      <span className="rounded-full bg-gold-100 px-3 py-1 font-semibold text-maroon-800">
                        {t({ en: 'Pinned', hi: 'पिन किया गया' })}
                      </span>
                    )}
                    <span>
                      {t({ en: 'From', hi: 'से' })}: {formatDate(item.startsAt, language)}
                    </span>
                    <span>
                      {t({ en: 'Until', hi: 'तक' })}: {formatDate(item.endsAt, language)}
                    </span>
                    {item.linkUrl && (
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-maroon-700 underline-offset-4 hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        {t({ en: 'Link', hi: 'लिंक' })}
                      </a>
                    )}
                  </div>
                </div>

                {confirmDeleteId === item.id ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <p className="text-base text-maroon-800">
                      {t({ en: 'Delete this news?', hi: 'यह समाचार हटाएँ?' })}
                    </p>
                    <div className="flex gap-2">
                      <button type="button" className="btn-outline" onClick={() => setConfirmDeleteId(null)} disabled={busy}>
                        {t({ en: 'Keep', hi: 'रखें' })}
                      </button>
                      <button
                        type="button"
                        className="rounded-xl bg-red-700 px-4 py-2 text-base font-semibold text-white hover:bg-red-800 disabled:opacity-60"
                        onClick={() => handleDelete(item)}
                        disabled={busy}
                      >
                        {t({ en: 'Delete', hi: 'हटाएँ' })}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-outline px-3 py-2"
                      onClick={() => toggleFlag(item, { isActive: !item.isActive })}
                      disabled={busy}
                    >
                      {item.isActive ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                      {item.isActive ? t({ en: 'Deactivate', hi: 'बंद करें' }) : t({ en: 'Activate', hi: 'चालू करें' })}
                    </button>
                    <button
                      type="button"
                      className="btn-outline px-3 py-2"
                      onClick={() => toggleFlag(item, { isPinned: !item.isPinned })}
                      disabled={busy}
                    >
                      {item.isPinned ? <PinOff className="h-4 w-4" aria-hidden="true" /> : <Pin className="h-4 w-4" aria-hidden="true" />}
                      {item.isPinned ? t({ en: 'Unpin', hi: 'अनपिन' }) : t({ en: 'Pin', hi: 'पिन करें' })}
                    </button>
                    <button
                      type="button"
                      className="btn-outline px-3 py-2"
                      onClick={() => setPanel({ mode: 'edit', item })}
                      disabled={busy}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      {t({ en: 'Edit', hi: 'बदलें' })}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-base font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                      onClick={() => setConfirmDeleteId(item.id)}
                      disabled={busy}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      {t({ en: 'Delete', hi: 'हटाएँ' })}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

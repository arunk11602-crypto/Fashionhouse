import { Loader2, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/lib/language';

interface CatalogStatusMessageProps {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function CatalogStatusMessage({ loading, error, onRetry }: CatalogStatusMessageProps) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-12 text-lg text-maroon-700 md:px-8" role="status">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
        {t({ en: 'Loading clothes...', hi: 'कपड़े लोड हो रहे हैं...' })}
      </div>
    );
  }

  if (!error) return null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-3xl bg-white px-6 py-10 text-center shadow-card" role="alert">
      <h2 className="text-2xl font-bold text-maroon-800">
        {t({ en: 'Clothes could not be loaded', hi: 'कपड़े लोड नहीं हो सके' })}
      </h2>
      <p className="max-w-md text-lg text-maroon-600">
        {t({
          en: 'Please check your internet connection and try again.',
          hi: 'कृपया अपना इंटरनेट कनेक्शन जाँचें और फिर से कोशिश करें।',
        })}
      </p>
      <button type="button" onClick={onRetry} className="btn-primary">
        <RefreshCw className="h-5 w-5" aria-hidden="true" />
        {t({ en: 'Try again', hi: 'फिर से कोशिश करें' })}
      </button>
    </div>
  );
}

import { Sparkles, Zap } from 'lucide-react';
import { useActiveFlashNews } from '@/lib/flash-news';
import { useLanguage } from '@/lib/language';

export function FlashNewsTicker() {
  const { t } = useLanguage();
  const { items, loading, error } = useActiveFlashNews();

  if (loading || error || items.length === 0) return null;

  return (
    <section
      aria-label={t({ en: 'Flash news', hi: 'फ्लैश न्यूज़' })}
      className="flex items-stretch overflow-hidden bg-maroon-800 text-cream-50"
    >
      <div className="flex shrink-0 items-center gap-2 bg-gold-500 px-4 py-3 text-base font-bold text-maroon-900 md:px-6">
        <Zap className="h-5 w-5" aria-hidden="true" />
        {t({ en: 'Flash News', hi: 'फ्लैश न्यूज़' })}
      </div>
      <div className="relative flex min-w-0 flex-1 overflow-hidden">
        <div className="flex w-max animate-ticker hover:[animation-play-state:paused]">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0">
              {items.map((item) => {
                const label = (
                  <>
                    <Sparkles className="h-4 w-4 opacity-80" aria-hidden="true" />
                    {t(item.text)}
                  </>
                );
                const style = { color: item.textColor, backgroundColor: item.backgroundColor };
                return (
                  <li key={`${copy}-${item.id}`} className="flex shrink-0 whitespace-nowrap">
                    {item.linkUrl && copy === 0 ? (
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={style}
                        className="flex items-center gap-3 px-6 py-3 text-lg underline-offset-4 hover:underline"
                      >
                        {label}
                      </a>
                    ) : (
                      <span style={style} className="flex items-center gap-3 px-6 py-3 text-lg">
                        {label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}

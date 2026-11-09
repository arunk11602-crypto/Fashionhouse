import { Languages } from 'lucide-react';
import { useLanguage, type Language } from '@/lib/language';

const OPTIONS: { value: Language; label: string }[] = [
  { value: 'hi', label: 'हिन्दी' },
  { value: 'en', label: 'English' },
];

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center gap-1 rounded-full border border-maroon-100 bg-white p-1 shadow-sm"
    >
      <Languages className="ml-2 hidden h-5 w-5 text-maroon-600 sm:block" aria-hidden="true" />
      {OPTIONS.map((option) => {
        const active = option.value === language;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => setLanguage(option.value)}
            className={`rounded-full px-3 py-1.5 text-base font-medium transition duration-200 ${
              active ? 'bg-maroon-700 text-cream-50 shadow-sm' : 'text-maroon-700 hover:bg-maroon-50'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

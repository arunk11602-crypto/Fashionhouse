import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/language';
import type { Bilingual } from '@/types/catalog';

interface SectionHeadingProps {
  title: Bilingual;
  description?: Bilingual;
  action?: { to: string; label: Bilingual };
}

export function SectionHeading({ title, description, action }: SectionHeadingProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-8">
      <div className="flex flex-col gap-3">
        <h2 className="text-3xl font-bold text-maroon-800 md:text-4xl">{t(title)}</h2>
        <span className="h-1 w-16 rounded-full bg-gold-500" aria-hidden="true" />
        {description && <p className="max-w-2xl text-lg text-maroon-600">{t(description)}</p>}
      </div>
      {action && (
        <Link
          to={action.to}
          className="group inline-flex items-center gap-2 rounded-full border-2 border-maroon-700 px-5 py-2.5 text-base font-medium text-maroon-700 transition duration-300 hover:bg-maroon-700 hover:text-cream-50"
        >
          {t(action.label)}
          <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

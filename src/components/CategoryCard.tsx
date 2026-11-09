import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/language';
import type { Bilingual } from '@/types/catalog';

interface CategoryCardProps {
  to: string;
  image: string;
  title: Bilingual;
  description: Bilingual;
}

export function CategoryCard({ to, image, title, description }: CategoryCardProps) {
  const { t } = useLanguage();

  return (
    <Link
      to={to}
      className="group relative isolate block aspect-[4/5] overflow-hidden rounded-3xl shadow-card transition duration-500 hover:-translate-y-1 hover:shadow-card-hover md:aspect-[3/4]"
    >
      <img
        src={image}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="absolute inset-0 -z-10 h-full w-full object-cover transition duration-700 group-hover:scale-105"
      />
      <span className="absolute inset-0 -z-10 bg-gradient-to-t from-maroon-900 via-maroon-900/40 to-transparent" />
      <div className="flex h-full flex-col justify-end gap-2 p-6 md:p-8">
        <h3 className="text-2xl font-bold text-cream-50 md:text-3xl">{t(title)}</h3>
        <p className="text-base leading-relaxed text-cream-200">{t(description)}</p>
        <span className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-gold-500 px-5 py-2 text-base font-medium text-maroon-900 transition group-hover:bg-gold-400">
          {t({ en: 'Browse', hi: 'देखें' })}
        </span>
      </div>
    </Link>
  );
}

import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CatalogStatusMessage } from '@/components/CatalogStatusMessage';
import { ProductCard } from '@/components/ProductCard';
import { SearchBar } from '@/components/SearchBar';
import { useCatalogProducts } from '@/lib/catalog';
import { filterProducts } from '@/lib/format';
import { useLanguage } from '@/lib/language';
import type { CatalogPage } from '@/lib/navigation';

export function CollectionPage({ page }: { page: CatalogPage }) {
  const { t } = useLanguage();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';

  const { products: catalog, loading, error, reload } = useCatalogProducts();
  const products = useMemo(() => filterProducts(catalog, page.filter, query), [catalog, page.filter, query]);

  const handleSearch = (next: string) => {
    setParams(next ? { q: next } : {});
  };

  return (
    <>
      <section className="bg-gradient-to-br from-maroon-900 via-maroon-800 to-maroon-700 px-4 py-16 text-cream-50 md:px-8 md:py-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-5">
          <p className="animate-fade-up text-base font-medium text-gold-300">{t({ en: 'Fashion House', hi: 'फैशन हाउस' })}</p>
          <h1 className="animate-fade-up animation-delay-150 text-4xl font-bold md:text-5xl">{t(page.label)}</h1>
          <p className="animate-fade-up animation-delay-300 max-w-2xl text-lg leading-relaxed text-cream-200">
            {t(page.description)}
          </p>
          <div className="animate-fade-up animation-delay-450 mt-4 max-w-2xl">
            <SearchBar key={page.path} defaultValue={query} onSearch={handleSearch} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-8">
          <p className="text-lg text-maroon-700" aria-live="polite">
            {query
              ? t({
                  en: `${products.length} items found for "${query}"`,
                  hi: `"${query}" के लिए ${products.length} कपड़े मिले`,
                })
              : t({ en: `${products.length} items`, hi: `${products.length} कपड़े` })}
          </p>
        </div>

        {loading || error ? (
          <CatalogStatusMessage loading={loading} error={error} onRetry={reload} />
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 rounded-3xl bg-white px-6 py-16 text-center shadow-card">
            <h2 className="text-2xl font-bold text-maroon-800">
              {t({ en: 'No clothes found', hi: 'कोई कपड़ा नहीं मिला' })}
            </h2>
            <p className="max-w-md text-lg text-maroon-600">
              {t({
                en: 'Try a different search word or browse the full stock.',
                hi: 'कोई दूसरा शब्द खोजें या पूरा स्टॉक देखें।',
              })}
            </p>
            <Link to="/all-stock" className="btn-primary">
              {t({ en: 'View All Clothes', hi: 'सभी कपड़े देखें' })}
            </Link>
          </div>
        )}
      </section>
    </>
  );
}

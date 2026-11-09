import { useNavigate } from 'react-router-dom';
import { CategoryCard } from '@/components/CategoryCard';
import { ProductShowcase } from '@/components/ProductShowcase';
import { SearchBar } from '@/components/SearchBar';
import { HeroBanner } from '@/components/home/HeroBanner';
import { FlashNewsTicker } from '@/components/layout/FlashNewsTicker';
import { CatalogStatusMessage } from '@/components/CatalogStatusMessage';
import { useCatalogProducts } from '@/lib/catalog';
import { filterProducts } from '@/lib/format';
import { useLanguage } from '@/lib/language';
import type { CatalogFilter } from '@/types/catalog';

const HOME_PREVIEW_COUNT = 4;

const CATEGORY_TILES = [
  {
    to: '/ladies-collection',
    image: 'https://images.pexels.com/photos/38526708/pexels-photo-38526708.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    title: { en: 'Ladies Collection', hi: 'लेडीज़ कलेक्शन' },
    description: { en: 'Sarees, kurtas and dresses for every occasion.', hi: 'हर मौके के लिए साड़ियाँ, कुर्ते और ड्रेस।' },
  },
  {
    to: '/gents-collection',
    image: 'https://images.pexels.com/photos/6764930/pexels-photo-6764930.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    title: { en: 'Gents Collection', hi: 'जेंट्स कलेक्शन' },
    description: { en: 'Suits, blazers and smart wear for men.', hi: 'पुरुषों के लिए सूट, ब्लेज़र और स्मार्ट कपड़े।' },
  },
  {
    to: '/kids-collection',
    image: 'https://images.pexels.com/photos/6261908/pexels-photo-6261908.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    title: { en: 'Kids Collection', hi: 'किड्स कलेक्शन' },
    description: { en: 'Comfortable, playful outfits for little ones.', hi: 'छोटे बच्चों के लिए आरामदायक और खूबसूरत कपड़े।' },
  },
];

export function HomePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { products, loading, error, reload } = useCatalogProducts();

  const preview = (filter: CatalogFilter) =>
    filterProducts(products, filter).slice(0, HOME_PREVIEW_COUNT);

  const handleSearch = (query: string) => {
    navigate(`/all-stock${query ? `?q=${encodeURIComponent(query)}` : ''}`);
  };

  return (
    <>
      <FlashNewsTicker />
      <HeroBanner />

      <div className="relative z-10 mx-auto -mt-8 max-w-3xl px-4 md:px-8">
        <SearchBar onSearch={handleSearch} />
      </div>

      {loading || error ? (
        <CatalogStatusMessage loading={loading} error={error} onRetry={reload} />
      ) : null}

      <ProductShowcase
        id="new-stock"
        title={{ en: 'New Stock', hi: 'नया स्टॉक' }}
        description={{ en: 'The latest arrivals from this season.', hi: 'इस सीज़न के ताज़ा नए आगमन।' }}
        viewAllPath="/new-stock"
        products={preview({ stockType: 'new' })}
      />

      <ProductShowcase
        id="old-stock"
        title={{ en: 'Old Stock', hi: 'पुराना स्टॉक' }}
        description={{ en: 'Carefully kept pieces at great value.', hi: 'सावधानी से संभालकर रखे गए, अच्छी कीमत वाले कपड़े।' }}
        viewAllPath="/old-stock"
        products={preview({ stockType: 'old' })}
      />

      <ProductShowcase
        id="premium"
        title={{ en: 'Premium Collection', hi: 'प्रीमियम कलेक्शन' }}
        description={{ en: 'Our finest fabrics and finishing for special occasions.', hi: 'खास मौकों के लिए हमारे सबसे बेहतरीन कपड़े।' }}
        viewAllPath="/premium-collection"
        products={preview({ tier: 'premium' })}
      />

      <ProductShowcase
        id="discount"
        title={{ en: 'Discount Sale', hi: 'डिस्काउंट सेल' }}
        description={{ en: 'Selected pieces with special sale prices.', hi: 'चुनिंदा कपड़ों पर खास सेल कीमतें।' }}
        viewAllPath="/discount-sale"
        products={preview({ onSale: true })}
      />

      <ProductShowcase
        id="final-stock"
        title={{ en: 'Final Stock', hi: 'फाइनल स्टॉक' }}
        description={{ en: 'Limited last pieces. Book before they are gone.', hi: 'सीमित आखिरी कपड़े। खत्म होने से पहले बुक करें।' }}
        viewAllPath="/final-stock"
        products={preview({ isFinal: true })}
      />

      <section id="categories" className="mx-auto max-w-7xl scroll-mt-32 px-4 py-14 md:px-8 md:py-20">
        <div className="pb-8">
          <h2 className="text-3xl font-bold text-maroon-800 md:text-4xl">
            {t({ en: 'Shop by Category', hi: 'श्रेणी के अनुसार खरीदें' })}
          </h2>
          <span className="mt-3 block h-1 w-16 rounded-full bg-gold-500" aria-hidden="true" />
        </div>
        <div className="grid gap-4 md:grid-cols-3 md:gap-6">
          {CATEGORY_TILES.map((tile) => (
            <CategoryCard key={tile.to} {...tile} />
          ))}
        </div>
      </section>
    </>
  );
}

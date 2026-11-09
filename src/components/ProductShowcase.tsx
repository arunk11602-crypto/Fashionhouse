import { ProductCard } from '@/components/ProductCard';
import { SectionHeading } from '@/components/SectionHeading';
import type { Bilingual, Product } from '@/types/catalog';

interface ProductShowcaseProps {
  id: string;
  title: Bilingual;
  description?: Bilingual;
  viewAllPath: string;
  products: Product[];
}

export function ProductShowcase({ id, title, description, viewAllPath, products }: ProductShowcaseProps) {
  if (products.length === 0) return null;

  return (
    <section id={id} className="mx-auto max-w-7xl scroll-mt-32 px-4 py-14 md:px-8 md:py-20">
      <SectionHeading
        title={title}
        description={description}
        action={{ to: viewAllPath, label: { en: 'View all', hi: 'सभी देखें' } }}
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

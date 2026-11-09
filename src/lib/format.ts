import type { CatalogFilter, Product } from '@/types/catalog';

const rupeeFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatRupees(amount: number): string {
  return rupeeFormatter.format(amount);
}

export function filterProducts(products: Product[], filter: CatalogFilter, query = ''): Product[] {
  const needle = query.trim().toLowerCase();
  return products.filter((product) => {
    if (filter.category && product.category !== filter.category) return false;
    if (filter.stockType && product.stockType !== filter.stockType) return false;
    if (filter.tier && product.tier !== filter.tier) return false;
    if (filter.onSale && product.salePrice === undefined) return false;
    if (filter.isFinal && !product.isFinal) return false;
    if (needle) {
      const haystack = `${product.name.en} ${product.name.hi} ${product.fabric.en} ${product.fabric.hi}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

export interface Bilingual {
  en: string;
  hi: string;
}

export type Category = 'ladies' | 'gents' | 'kids' | 'unisex';
export type StockType = 'new' | 'old';
export type CollectionTier = 'premium' | 'simple' | 'regular';

export interface ProductVariant {
  id: string;
  size: string;
  colour: string;
  totalQuantity: number;
  availableQuantity: number;
}

export interface Product {
  id: string;
  sku: string;
  name: Bilingual;
  category: Category;
  stockType: StockType;
  tier: CollectionTier;
  price: number;
  salePrice?: number;
  isFinal: boolean;
  fabric: Bilingual;
  image: string;
  status: string;
  minQuantity: number;
  maxQuantity: number;
  variants: ProductVariant[];
}

export interface CatalogFilter {
  category?: Category;
  stockType?: StockType;
  tier?: CollectionTier;
  onSale?: boolean;
  isFinal?: boolean;
}

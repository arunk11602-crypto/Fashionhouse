import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Category, CollectionTier, Product, StockType } from '@/types/catalog';

interface VariantRow {
  id: string;
  size: string;
  colour: string;
  total_quantity: number;
  available_quantity: number;
}

interface ProductRow {
  id: string;
  sku: string;
  name: string;
  name_hi: string | null;
  customer_category: Category;
  stock_type: StockType;
  collection: CollectionTier;
  sale_type: 'normal' | 'discount' | 'final';
  fabric: string | null;
  original_price: number;
  sale_price: number | null;
  status: string;
  image_urls: string[] | null;
  minimum_booking_quantity: number | null;
  maximum_booking_quantity: number | null;
  product_variants: VariantRow[];
}

const PRODUCT_COLUMNS =
  'id, sku, name, name_hi, customer_category, stock_type, collection, sale_type, fabric, original_price, sale_price, status, image_urls, minimum_booking_quantity, maximum_booking_quantity, created_at, product_variants(id, size, colour, total_quantity, available_quantity)';

function mapProduct(row: ProductRow): Product {
  const fabric = row.fabric ?? '';
  return {
    id: row.id,
    sku: row.sku,
    name: { en: row.name, hi: row.name_hi || row.name },
    category: row.customer_category,
    stockType: row.stock_type,
    tier: row.collection,
    price: Number(row.original_price),
    salePrice: row.sale_price === null ? undefined : Number(row.sale_price),
    isFinal: row.sale_type === 'final',
    fabric: { en: fabric, hi: fabric },
    image: row.image_urls?.[0] ?? '',
    status: row.status,
    minQuantity: Math.max(1, row.minimum_booking_quantity ?? 1),
    maxQuantity: Math.max(1, row.maximum_booking_quantity ?? 10),
    variants: (row.product_variants ?? []).map((variant) => ({
      id: variant.id,
      size: variant.size,
      colour: variant.colour,
      totalQuantity: variant.total_quantity,
      availableQuantity: variant.available_quantity,
    })),
  };
}

export async function fetchCatalogProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('is_published', true)
    .eq('is_archived', false)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  if (!Array.isArray(data)) throw new Error('Unexpected product data');
  return (data as unknown as ProductRow[]).map(mapProduct);
}

export interface VariantLive {
  available: number;
  unitPrice: number;
  minQuantity: number;
  maxQuantity: number;
  bookable: boolean;
}

interface VariantLiveRow {
  id: string;
  available_quantity: number;
  products: {
    original_price: number;
    sale_price: number | null;
    is_published: boolean;
    is_archived: boolean;
    status: string;
    minimum_booking_quantity: number | null;
    maximum_booking_quantity: number | null;
  } | null;
}

const NOT_BOOKABLE_STATUSES = ['Coming Soon', 'Sold Out', 'Booked'];

/** Current stock, price and booking limits straight from the database, keyed by variant id. */
export async function fetchVariantLive(variantIds: string[]): Promise<Map<string, VariantLive>> {
  if (variantIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from('product_variants')
    .select(
      'id, available_quantity, products(original_price, sale_price, is_published, is_archived, status, minimum_booking_quantity, maximum_booking_quantity)',
    )
    .in('id', variantIds);

  if (error) throw new Error(error.message);
  if (!Array.isArray(data)) throw new Error('Unexpected stock data');

  const live = new Map<string, VariantLive>();
  for (const row of data as unknown as VariantLiveRow[]) {
    const product = row.products;
    if (!product) continue;
    live.set(row.id, {
      available: row.available_quantity,
      unitPrice: Number(product.sale_price ?? product.original_price),
      minQuantity: Math.max(1, product.minimum_booking_quantity ?? 1),
      maxQuantity: Math.max(1, product.maximum_booking_quantity ?? 10),
      bookable: product.is_published && !product.is_archived && !NOT_BOOKABLE_STATUSES.includes(product.status),
    });
  }
  return live;
}

export function totalAvailable(product: Product): number {
  return product.variants.reduce((sum, variant) => sum + variant.availableQuantity, 0);
}

export interface CatalogState {
  products: Product[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useCatalogProducts(): CatalogState {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    fetchCatalogProducts()
      .then((items) => {
        if (!active) return;
        setProducts(items);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : 'Unknown error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((key) => key + 1);
  }, []);

  return { products, loading, error, reload };
}

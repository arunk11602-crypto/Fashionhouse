import { supabase } from '@/lib/supabase';

export type ManualStatus = 'In Stock' | 'Coming Soon' | 'Sold Out' | 'Final Pieces';

export const MANUAL_STATUSES: ManualStatus[] = ['In Stock', 'Coming Soon', 'Sold Out', 'Final Pieces'];

export interface AdminVariant {
  id: string;
  size: string;
  colour: string;
  available: number;
  booked: number;
  sold: number;
}

export interface AdminProduct {
  id: string;
  sku: string;
  name: string;
  status: string;
  isPublished: boolean;
  isArchived: boolean;
  isDemo: boolean;
  variants: AdminVariant[];
}

interface ProductRow {
  id: string;
  sku: string;
  name: string;
  status: string;
  is_published: boolean;
  is_archived: boolean;
  is_demo: boolean;
  product_variants: {
    id: string;
    size: string;
    colour: string;
    available_quantity: number;
    booked_quantity: number;
    sold_quantity: number;
  }[];
}

export async function fetchAdminProducts(): Promise<AdminProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select(
      'id, sku, name, status, is_published, is_archived, is_demo, product_variants(id, size, colour, available_quantity, booked_quantity, sold_quantity)',
    )
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  if (!Array.isArray(data)) throw new Error('Unexpected product data');
  return (data as unknown as ProductRow[]).map((row) => ({
    id: row.id,
    sku: row.sku,
    name: row.name,
    status: row.status,
    isPublished: row.is_published,
    isArchived: row.is_archived,
    isDemo: row.is_demo,
    variants: (row.product_variants ?? [])
      .map((variant) => ({
        id: variant.id,
        size: variant.size,
        colour: variant.colour,
        available: variant.available_quantity,
        booked: variant.booked_quantity,
        sold: variant.sold_quantity,
      }))
      .sort((a, b) => a.colour.localeCompare(b.colour) || a.size.localeCompare(b.size, undefined, { numeric: true })),
  }));
}

export async function setVariantAvailable(variantId: string, available: number): Promise<void> {
  const { error } = await supabase.rpc('admin_set_variant_stock', { p_variant_id: variantId, p_available: available });
  if (error) throw new Error(error.message);
}

export async function updateProductFlags(
  productId: string,
  changes: { isPublished?: boolean; isArchived?: boolean; status?: ManualStatus },
): Promise<void> {
  const update: Record<string, boolean | string> = {};
  if (changes.isPublished !== undefined) update.is_published = changes.isPublished;
  if (changes.isArchived !== undefined) update.is_archived = changes.isArchived;
  if (changes.status !== undefined) update.status = changes.status;
  const { data, error } = await supabase.from('products').update(update).eq('id', productId).select('id');
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error('not_updated');
}

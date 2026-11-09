import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { VariantLive } from '@/lib/catalog';
import type { Bilingual } from '@/types/catalog';

export interface BookingListItem {
  variantId: string;
  productId: string;
  productName: Bilingual;
  image: string;
  size: string;
  colour: string;
  quantity: number;
  unitPrice: number;
  available: number;
  minQuantity: number;
  maxQuantity: number;
}

/** What changed when the list was compared with the live catalogue. */
export interface SyncResult {
  removed: BookingListItem[];
  adjusted: BookingListItem[];
  repriced: BookingListItem[];
}

interface BookingListContextValue {
  items: BookingListItem[];
  addItem: (item: BookingListItem) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearList: () => void;
  /** Applies live stock, price and limits. Returns what changed so the page can tell the customer. */
  syncWithCatalog: (live: Map<string, VariantLive>) => SyncResult;
}

const STORAGE_KEY = 'fashion-house-booking-list';
const MAX_ITEMS = 20;
const DEFAULT_MAX_QUANTITY = 10;

const BookingListContext = createContext<BookingListContextValue | null>(null);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toCount(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
}

/** Keeps only well-formed entries and fills limits that older saved lists did not have. */
function sanitizeItem(raw: unknown): BookingListItem | null {
  if (!isRecord(raw)) return null;
  const name = raw.productName;
  if (
    typeof raw.variantId !== 'string' ||
    typeof raw.productId !== 'string' ||
    !isRecord(name) ||
    typeof name.en !== 'string' ||
    typeof name.hi !== 'string' ||
    typeof raw.size !== 'string' ||
    typeof raw.colour !== 'string' ||
    typeof raw.unitPrice !== 'number' ||
    !Number.isFinite(raw.unitPrice)
  ) {
    return null;
  }
  const minQuantity = Math.max(1, toCount(raw.minQuantity, 1));
  const maxQuantity = Math.max(minQuantity, toCount(raw.maxQuantity, DEFAULT_MAX_QUANTITY));
  const available = toCount(raw.available, 0);
  const quantity = Math.min(Math.max(toCount(raw.quantity, 1), 1), Math.max(available, 1), maxQuantity);
  return {
    variantId: raw.variantId,
    productId: raw.productId,
    productName: { en: name.en, hi: name.hi },
    image: typeof raw.image === 'string' ? raw.image : '',
    size: raw.size,
    colour: raw.colour,
    quantity,
    unitPrice: raw.unitPrice,
    available,
    minQuantity,
    maxQuantity,
  };
}

function readStoredList(): BookingListItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(sanitizeItem)
      .filter((item): item is BookingListItem => item !== null)
      .slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export function BookingListProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BookingListItem[]>(readStoredList);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage can be full or blocked; the list still works for this visit.
    }
  }, [items]);

  const addItem = useCallback((item: BookingListItem) => {
    setItems((current) => {
      const existing = current.find((entry) => entry.variantId === item.variantId);
      if (existing) {
        const quantity = Math.min(existing.quantity + item.quantity, item.available, item.maxQuantity);
        return current.map((entry) =>
          entry.variantId === item.variantId ? { ...item, quantity: Math.max(quantity, 1) } : entry,
        );
      }
      if (current.length >= MAX_ITEMS) return current;
      return [...current, item];
    });
  }, []);

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    setItems((current) =>
      current.map((entry) => {
        if (entry.variantId !== variantId) return entry;
        const upper = Math.max(entry.minQuantity, Math.min(entry.maxQuantity, entry.available));
        return { ...entry, quantity: Math.max(entry.minQuantity, Math.min(quantity, upper)) };
      }),
    );
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setItems((current) => current.filter((entry) => entry.variantId !== variantId));
  }, []);

  const clearList = useCallback(() => setItems([]), []);

  const syncWithCatalog = useCallback(
    (live: Map<string, VariantLive>): SyncResult => {
      const result: SyncResult = { removed: [], adjusted: [], repriced: [] };
      const next: BookingListItem[] = [];

      for (const entry of items) {
        const fresh = live.get(entry.variantId);
        if (!fresh || !fresh.bookable || fresh.available < fresh.minQuantity) {
          result.removed.push(entry);
          continue;
        }
        const upper = Math.min(fresh.maxQuantity, fresh.available);
        const quantity = Math.max(fresh.minQuantity, Math.min(entry.quantity, upper));
        const updated: BookingListItem = {
          ...entry,
          available: fresh.available,
          unitPrice: fresh.unitPrice,
          minQuantity: fresh.minQuantity,
          maxQuantity: fresh.maxQuantity,
          quantity,
        };
        if (quantity !== entry.quantity) result.adjusted.push(updated);
        if (fresh.unitPrice !== entry.unitPrice) result.repriced.push(updated);
        next.push(updated);
      }

      setItems(next);
      return result;
    },
    [items],
  );

  const value = useMemo<BookingListContextValue>(
    () => ({ items, addItem, updateQuantity, removeItem, clearList, syncWithCatalog }),
    [items, addItem, updateQuantity, removeItem, clearList, syncWithCatalog],
  );

  return <BookingListContext.Provider value={value}>{children}</BookingListContext.Provider>;
}

export function useBookingList(): BookingListContextValue {
  const context = useContext(BookingListContext);
  if (!context) throw new Error('useBookingList must be used within BookingListProvider');
  return context;
}

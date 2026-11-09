const STORAGE_KEY = 'fashion-house-saved-bookings';
const MAX_SAVED = 50;
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

export interface SavedBookingItem {
  productName: string;
  size: string;
  colour: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Kept on the customer's own device so "My Booking" can list their requests.
 * Contact details (mobile, address, email) are deliberately not stored: the shop has them,
 * and a shared phone or computer should not reveal them.
 */
export interface SavedBooking {
  code: string;
  createdAt: string;
  customerName: string;
  totalAmount: number;
  items: SavedBookingItem[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function sanitize(raw: unknown): SavedBooking | null {
  if (!isRecord(raw) || typeof raw.code !== 'string' || typeof raw.createdAt !== 'string') return null;
  const createdAt = Date.parse(raw.createdAt);
  if (Number.isNaN(createdAt) || Date.now() - createdAt > MAX_AGE_MS) return null;
  const items = Array.isArray(raw.items)
    ? raw.items.filter(isRecord).map((item) => ({
        productName: String(item.productName ?? ''),
        size: String(item.size ?? ''),
        colour: String(item.colour ?? ''),
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
      }))
    : [];
  return {
    code: raw.code,
    createdAt: raw.createdAt,
    customerName: typeof raw.customerName === 'string' ? raw.customerName : '',
    totalAmount: Number(raw.totalAmount) || 0,
    items,
  };
}

export function loadSavedBookings(): SavedBooking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const cleaned = parsed.map(sanitize).filter((entry): entry is SavedBooking => entry !== null);
    // Older versions stored contact details; rewriting drops them and removes bookings older than 90 days.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    return cleaned;
  } catch {
    return [];
  }
}

export function saveBooking(booking: SavedBooking): void {
  try {
    const next = [booking, ...loadSavedBookings().filter((entry) => entry.code !== booking.code)].slice(0, MAX_SAVED);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage is optional: the booking is already saved on the server.
  }
}

export function findSavedBooking(code: string): SavedBooking | undefined {
  return loadSavedBookings().find((entry) => entry.code === code);
}

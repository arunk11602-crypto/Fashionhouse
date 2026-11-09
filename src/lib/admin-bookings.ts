import { supabase } from '@/lib/supabase';
import type { BookingStatus } from '@/lib/booking-api';

export interface AdminBookingItem {
  quantity: number;
  unitPrice: number;
  size: string;
  colour: string;
  productName: string;
}

export interface AdminBooking {
  id: string;
  code: string;
  status: BookingStatus;
  createdAt: string;
  customerName: string;
  mobile: string;
  whatsappNumber: string;
  email: string | null;
  address: string;
  city: string;
  pinCode: string;
  preferredContact: string;
  note: string | null;
  items: AdminBookingItem[];
  total: number;
}

interface BookingRow {
  id: string;
  booking_code: string;
  status: BookingStatus;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  whatsapp_number: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  pin_code: string | null;
  preferred_contact: string | null;
  note: string | null;
  booking_items: {
    quantity: number;
    unit_price: number;
    product_variants: { size: string; colour: string } | null;
    products: { name: string } | null;
  }[];
}

const BOOKING_COLUMNS =
  'id, booking_code, status, created_at, customer_name, customer_phone, whatsapp_number, email, address, city, pin_code, preferred_contact, note, booking_items(quantity, unit_price, product_variants(size, colour), products(name))';

/** Which statuses the owner may move a booking to from each status. Finished bookings are final. */
export const NEXT_STATUSES: Record<BookingStatus, BookingStatus[]> = {
  new: ['pending', 'confirmed', 'rejected', 'cancelled'],
  pending: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['ready', 'completed', 'cancelled'],
  ready: ['completed', 'cancelled'],
  completed: [],
  rejected: [],
  cancelled: [],
};

export const OPEN_STATUSES: BookingStatus[] = ['new', 'pending', 'confirmed', 'ready'];

function mapBooking(row: BookingRow): AdminBooking {
  const items = (row.booking_items ?? []).map((item) => ({
    quantity: item.quantity,
    unitPrice: Number(item.unit_price),
    size: item.product_variants?.size ?? '',
    colour: item.product_variants?.colour ?? '',
    productName: item.products?.name ?? '',
  }));
  return {
    id: row.id,
    code: row.booking_code,
    status: row.status,
    createdAt: row.created_at,
    customerName: row.customer_name,
    mobile: row.customer_phone,
    whatsappNumber: row.whatsapp_number ?? row.customer_phone,
    email: row.email,
    address: row.address ?? '',
    city: row.city ?? '',
    pinCode: row.pin_code ?? '',
    preferredContact: row.preferred_contact ?? 'phone',
    note: row.note,
    items,
    total: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
  };
}

export async function fetchAdminBookings(): Promise<AdminBooking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) throw new Error(error.message);
  if (!Array.isArray(data)) throw new Error('Unexpected booking data');
  return (data as unknown as BookingRow[]).map(mapBooking);
}

/** Cancelling or rejecting gives the pieces back to stock and completing marks them sold; the database does both. */
export async function updateBookingStatus(id: string, status: BookingStatus): Promise<void> {
  const { data, error } = await supabase.from('bookings').update({ status }).eq('id', id).select('id');
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error('not_updated');
}

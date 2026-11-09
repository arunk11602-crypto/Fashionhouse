import { supabase } from '@/lib/supabase';

export interface BookingRequestInput {
  submissionId: string;
  customerName: string;
  mobile: string;
  whatsappNumber: string;
  email: string;
  address: string;
  city: string;
  pinCode: string;
  preferredContact: 'phone' | 'whatsapp' | 'email';
  note: string;
  termsAccepted: boolean;
  items: { variantId: string; quantity: number }[];
}

export type BookingStatus = 'new' | 'pending' | 'confirmed' | 'ready' | 'completed' | 'rejected' | 'cancelled';

export interface BookingStatusItem {
  quantity: number;
  unit_price: number;
  size: string;
  colour: string;
  product_name: string;
  product_name_hi: string | null;
  image: string | null;
}

export interface BookingStatusRecord {
  booking_code: string;
  status: BookingStatus;
  created_at: string;
  items: BookingStatusItem[];
}

const BOOKING_STATUSES: BookingStatus[] = ['new', 'pending', 'confirmed', 'ready', 'completed', 'rejected', 'cancelled'];

export class BookingError extends Error {
  /**
   * True when the server clearly answered "no" (so nothing was saved and a fresh attempt is safe).
   * False when the outcome is unknown, for example a dropped connection: the request may have been
   * saved, so the same submission id must be reused to avoid a duplicate booking.
   */
  constructor(
    public readonly reason: string,
    public readonly definitive: boolean = true,
  ) {
    super(reason);
  }
}

export async function submitBookingRequest(input: BookingRequestInput): Promise<string> {
  const { data, error } = await supabase.rpc('create_booking', {
    p_submission_id: input.submissionId,
    p_customer_name: input.customerName,
    p_customer_phone: input.mobile,
    p_whatsapp_number: input.whatsappNumber,
    p_email: input.email,
    p_address: input.address,
    p_city: input.city,
    p_pin_code: input.pinCode,
    p_preferred_contact: input.preferredContact,
    p_note: input.note,
    p_terms_accepted: input.termsAccepted,
    p_items: input.items.map((item) => ({ variant_id: item.variantId, quantity: item.quantity })),
  });

  if (error) {
    const reason = BOOKING_ERROR_REASONS.find((known) => error.message.includes(known));
    if (reason) throw new BookingError(reason, true);
    // A database or HTTP error carries a code. A network failure or timeout does not.
    throw new BookingError(error.message, Boolean(error.code));
  }
  if (typeof data !== 'string' || data.length === 0) throw new BookingError('invalid_response', false);
  return data;
}

const BOOKING_ERROR_REASONS = [
  'insufficient_stock',
  'variant_not_bookable',
  'variant_not_found',
  'invalid_name',
  'invalid_phone',
  'invalid_email',
  'invalid_address',
  'invalid_city',
  'invalid_pin',
  'invalid_contact_method',
  'invalid_note',
  'terms_not_accepted',
  'invalid_items',
  'invalid_quantity',
  'invalid_submission',
  'too_many_requests',
];

export async function fetchBookingStatuses(codes: string[]): Promise<BookingStatusRecord[]> {
  if (codes.length === 0) return [];
  const { data, error } = await supabase.rpc('get_bookings_by_codes', { p_codes: codes });
  if (error) throw new Error(error.message);
  if (!Array.isArray(data)) throw new Error('Unexpected booking data');

  return (data as unknown[]).filter((row): row is BookingStatusRecord => {
    if (typeof row !== 'object' || row === null) return false;
    const record = row as Partial<BookingStatusRecord>;
    return (
      typeof record.booking_code === 'string' &&
      BOOKING_STATUSES.includes(record.status as BookingStatus) &&
      Array.isArray(record.items)
    );
  });
}

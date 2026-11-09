import type { Bilingual } from '@/types/catalog';

export const SHOP = {
  name: 'Fashion House',
  whatsappNumber: '919876543210',
  phone: '+91 98765 43210',
  email: 'hello@fashionhouse.in',
  address: {
    en: 'Main Bazaar Road, Near Clock Tower, Your City',
    hi: 'मेन बाज़ार रोड, घड़ी चौक के पास, आपका शहर',
  } satisfies Bilingual,
  hours: {
    en: 'Mon - Sun: 10:00 AM to 9:00 PM',
    hi: 'सोम - रवि: सुबह 10:00 से रात 9:00 बजे तक',
  } satisfies Bilingual,
};

export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${SHOP.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** WhatsApp link to a customer's Indian mobile number (10 digits). */
export function whatsappLinkTo(mobile: string, message?: string): string {
  const digits = mobile.replace(/\D/g, '');
  const base = `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

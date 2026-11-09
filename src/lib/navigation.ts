import type { CatalogFilter, Bilingual } from '@/types/catalog';

export interface CatalogPage {
  path: string;
  label: Bilingual;
  description: Bilingual;
  filter: CatalogFilter;
}

export const CATALOG_PAGES: CatalogPage[] = [
  {
    path: '/all-stock',
    label: { en: 'All Stock', hi: 'सभी स्टॉक' },
    description: { en: 'Every piece in our shop, new and old, in one place.', hi: 'हमारी दुकान के सभी कपड़े, नया और पुराना, एक ही जगह।' },
    filter: {},
  },
  {
    path: '/new-stock',
    label: { en: 'New Stock', hi: 'नया स्टॉक' },
    description: { en: 'The latest arrivals, fresh from the season.', hi: 'इस सीज़न के ताज़ा नए आगमन।' },
    filter: { stockType: 'new' },
  },
  {
    path: '/old-stock',
    label: { en: 'Old Stock', hi: 'पुराना स्टॉक' },
    description: { en: 'Carefully kept pieces at great value.', hi: 'सावधानी से संभालकर रखे गए, अच्छी कीमत वाले कपड़े।' },
    filter: { stockType: 'old' },
  },
  {
    path: '/premium-collection',
    label: { en: 'Premium Collection', hi: 'प्रीमियम कलेक्शन' },
    description: { en: 'Our finest fabrics and finishing for special occasions.', hi: 'खास मौकों के लिए हमारे सबसे बेहतरीन कपड़े।' },
    filter: { tier: 'premium' },
  },
  {
    path: '/simple-collection',
    label: { en: 'Simple Collection', hi: 'सिंपल कलेक्शन' },
    description: { en: 'Everyday comfort with a clean, timeless look.', hi: 'रोज़मर्रा के आराम के साथ साफ़-सुथरा, कालातीत लुक।' },
    filter: { tier: 'simple' },
  },
  {
    path: '/discount-sale',
    label: { en: 'Discount Sale', hi: 'डिस्काउंट सेल' },
    description: { en: 'Selected pieces with special sale prices.', hi: 'चुनिंदा कपड़ों पर खास सेल कीमतें।' },
    filter: { onSale: true },
  },
  {
    path: '/final-stock',
    label: { en: 'Final Stock', hi: 'फाइनल स्टॉक' },
    description: { en: 'Limited last pieces. Book before they are gone.', hi: 'सीमित आखिरी कपड़े। खत्म होने से पहले बुक करें।' },
    filter: { isFinal: true },
  },
  {
    path: '/kids-collection',
    label: { en: 'Kids Collection', hi: 'किड्स कलेक्शन' },
    description: { en: 'Comfortable, playful outfits for little ones.', hi: 'छोटे बच्चों के लिए आरामदायक और खूबसूरत कपड़े।' },
    filter: { category: 'kids' },
  },
  {
    path: '/ladies-collection',
    label: { en: 'Ladies Collection', hi: 'लेडीज़ कलेक्शन' },
    description: { en: 'Sarees, kurtas and dresses for every occasion.', hi: 'हर मौके के लिए साड़ियाँ, कुर्ते और ड्रेस।' },
    filter: { category: 'ladies' },
  },
  {
    path: '/gents-collection',
    label: { en: 'Gents Collection', hi: 'जेंट्स कलेक्शन' },
    description: { en: 'Suits, blazers and smart everyday wear for men.', hi: 'पुरुषों के लिए सूट, ब्लेज़र और रोज़ के स्मार्ट कपड़े।' },
    filter: { category: 'gents' },
  },
];

export const NAV_PRIMARY: { path: string; label: Bilingual }[] = [
  { path: '/', label: { en: 'Home', hi: 'होम' } },
  ...CATALOG_PAGES.map((page) => ({ path: page.path, label: page.label })),
  { path: '/my-booking', label: { en: 'My Booking', hi: 'मेरी बुकिंग' } },
  { path: '/contact', label: { en: 'Contact Us', hi: 'संपर्क करें' } },
];

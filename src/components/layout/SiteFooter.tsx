import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/layout/Logo';
import { SHOP } from '@/data/shop';
import { CATALOG_PAGES } from '@/lib/navigation';
import { useLanguage } from '@/lib/language';

const QUICK_LINK_PATHS = ['/new-stock', '/old-stock', '/premium-collection', '/discount-sale', '/final-stock'];

export function SiteFooter() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();
  const quickLinks = CATALOG_PAGES.filter((page) => QUICK_LINK_PATHS.includes(page.path));

  return (
    <footer className="bg-maroon-900 text-cream-200">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 md:grid-cols-3 md:px-8">
        <div className="flex flex-col gap-6">
          <Logo tone="light" />
          <p className="max-w-sm text-lg leading-relaxed">
            {t({
              en: 'New and old clothing stock, all in one place. Choose your favourite piece and book it easily.',
              hi: 'नया और पुराना कपड़ों का स्टॉक एक ही जगह। अपनी पसंद का कपड़ा चुनें और आसानी से बुक करें।',
            })}
          </p>
        </div>

        <div>
          <h2 className="mb-5 text-xl font-bold text-cream-50">{t({ en: 'Quick Links', hi: 'त्वरित लिंक' })}</h2>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-3 text-lg">
            {quickLinks.map((page) => (
              <li key={page.path}>
                <Link to={page.path} className="transition hover:text-gold-300">
                  {t(page.label)}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/booking" className="transition hover:text-gold-300">
                {t({ en: 'Booking List', hi: 'बुकिंग सूची' })}
              </Link>
            </li>
            <li>
              <Link to="/my-booking" className="transition hover:text-gold-300">
                {t({ en: 'My Booking', hi: 'मेरी बुकिंग' })}
              </Link>
            </li>
            <li>
              <Link to="/contact" className="transition hover:text-gold-300">
                {t({ en: 'Contact Us', hi: 'संपर्क करें' })}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-5 text-xl font-bold text-cream-50">{t({ en: 'Visit Us', hi: 'हमसे मिलें' })}</h2>
          <ul className="flex flex-col gap-4 text-lg">
            <li className="flex gap-3">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-gold-300" />
              <span>{t(SHOP.address)}</span>
            </li>
            <li className="flex gap-3">
              <Phone className="mt-1 h-5 w-5 shrink-0 text-gold-300" />
              <a href={`tel:+${SHOP.whatsappNumber}`} className="transition hover:text-gold-300">
                {SHOP.phone}
              </a>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-1 h-5 w-5 shrink-0 text-gold-300" />
              <a href={`mailto:${SHOP.email}`} className="transition hover:text-gold-300">
                {SHOP.email}
              </a>
            </li>
            <li className="flex gap-3">
              <Clock className="mt-1 h-5 w-5 shrink-0 text-gold-300" />
              <span>{t(SHOP.hours)}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-maroon-700">
        <p className="mx-auto max-w-7xl px-4 py-6 text-base text-cream-300 md:px-8">
          © {year} Fashion House. {t({ en: 'All rights reserved.', hi: 'सर्वाधिकार सुरक्षित।' })}
          {' · '}
          <Link to="/admin-login" className="opacity-60 transition hover:text-gold-300 hover:opacity-100">
            {t({ en: 'Owner login', hi: 'मालिक लॉगिन' })}
          </Link>
        </p>
      </div>
    </footer>
  );
}

import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/language';

const HERO_IMAGE = 'https://images.pexels.com/photos/11911863/pexels-photo-11911863.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

export function HeroBanner() {
  const { t } = useLanguage();

  return (
    <section className="relative isolate overflow-hidden bg-maroon-900 text-cream-50">
      <img
        src={HERO_IMAGE}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-45 animate-fade-in"
      />
      <span className="absolute inset-0 -z-10 bg-gradient-to-r from-maroon-900 via-maroon-900/85 to-maroon-700/30" />

      <div className="mx-auto flex max-w-7xl flex-col justify-center gap-6 px-4 py-20 md:min-h-[38rem] md:px-8 md:py-28">
        <p className="animate-fade-up inline-flex w-fit items-center gap-2 rounded-full border border-gold-400/60 px-4 py-2 text-base text-gold-300">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {t({ en: 'New and old stock, all in one place', hi: 'नया और पुराना स्टॉक, एक ही जगह' })}
        </p>

        <h1 className="animate-fade-up animation-delay-150 max-w-3xl text-4xl font-bold sm:text-5xl lg:text-6xl">
          {t({ en: 'Welcome to Fashion House', hi: 'Fashion House में आपका स्वागत है' })}
        </h1>

        <p className="animate-fade-up animation-delay-300 max-w-2xl text-lg leading-relaxed text-cream-200 md:text-xl">
          {t({
            en: 'Browse new and old clothing stock in one place. Choose the piece you love and book it easily.',
            hi: 'नया और पुराना कपड़ों का स्टॉक एक ही जगह देखें। अपनी पसंद का कपड़ा चुनें और आसानी से बुक करें।',
          })}
        </p>

        <div className="animate-fade-up animation-delay-450 flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
          <Link to="/new-stock" className="btn-gold">
            {t({ en: 'View New Stock', hi: 'नया स्टॉक देखें' })}
          </Link>
          <Link to="/old-stock" className="btn-outline">
            {t({ en: 'View Old Stock', hi: 'पुराना स्टॉक देखें' })}
          </Link>
          <Link to="/all-stock" className="btn-outline">
            {t({ en: 'View All Clothes', hi: 'सभी कपड़े देखें' })}
          </Link>
          <a
            href="#new-stock"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-cream-50 px-6 py-3 text-lg font-medium text-maroon-800 shadow-md transition duration-300 hover:-translate-y-0.5 hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-300"
          >
            {t({ en: 'Book Your Choice', hi: 'अपनी पसंद बुक करें' })}
          </a>
        </div>
      </div>
    </section>
  );
}

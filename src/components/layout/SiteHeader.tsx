import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Logo } from '@/components/layout/Logo';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
import { NAV_PRIMARY } from '@/lib/navigation';
import { useLanguage } from '@/lib/language';

export function SiteHeader() {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gold-300/40 bg-cream-50/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
        <Logo />
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={t({ en: 'Open menu', hi: 'मेनू खोलें' })}
            className="grid h-11 w-11 place-items-center rounded-full border border-maroon-100 bg-white text-maroon-800 transition hover:bg-maroon-50 lg:hidden"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <nav
        aria-label={t({ en: 'Main navigation', hi: 'मुख्य मेनू' })}
        className="hidden border-t border-gold-300/40 lg:block"
      >
        <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none] md:px-8 [&::-webkit-scrollbar]:hidden">
          {NAV_PRIMARY.map((item) => (
            <li key={item.path} className="shrink-0">
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `block whitespace-nowrap rounded-full px-3 py-2 text-base font-medium transition duration-200 ${
                    isActive ? 'bg-maroon-700 text-cream-50' : 'text-maroon-800 hover:bg-maroon-50'
                  }`
                }
              >
                {t(item.label)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {menuOpen && (
        <nav
          id="mobile-menu"
          aria-label={t({ en: 'Main navigation', hi: 'मुख्य मेनू' })}
          className="max-h-[calc(100vh-80px)] overflow-y-auto border-t border-gold-300/40 bg-cream-50 lg:hidden animate-fade-in"
        >
          <ul className="grid grid-cols-2 gap-2 p-4">
            {NAV_PRIMARY.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `flex min-h-[3.5rem] items-center rounded-2xl px-4 py-3 text-lg font-medium transition duration-200 ${
                      isActive
                        ? 'bg-maroon-700 text-cream-50'
                        : 'bg-white text-maroon-800 shadow-sm hover:bg-maroon-50'
                    }`
                  }
                >
                  {t(item.label)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

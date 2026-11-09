import { Shirt } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LogoProps {
  tone?: 'light' | 'dark';
}

export function Logo({ tone = 'dark' }: LogoProps) {
  const isLight = tone === 'light';
  return (
    <Link to="/" className="group inline-flex items-center gap-3" aria-label="Fashion House">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-maroon-700 text-gold-400 shadow-md transition duration-300 group-hover:-rotate-6 group-hover:scale-105">
        <Shirt className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <span className="flex flex-col leading-tight">
        <span className={`text-2xl font-bold tracking-tight ${isLight ? 'text-cream-50' : 'text-maroon-800'}`}>
          Fashion House
        </span>
        <span className={`text-sm font-medium tracking-wide ${isLight ? 'text-gold-300' : 'text-gold-700'}`}>
          फैशन हाउस
        </span>
      </span>
    </Link>
  );
}

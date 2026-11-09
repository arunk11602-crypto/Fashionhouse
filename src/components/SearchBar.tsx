import { Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useLanguage } from '@/lib/language';

interface SearchBarProps {
  defaultValue?: string;
  onSearch: (query: string) => void;
}

export function SearchBar({ defaultValue = '', onSearch }: SearchBarProps) {
  const { t } = useLanguage();
  const [value, setValue] = useState(defaultValue);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(value.trim());
  };

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="flex w-full items-center gap-2 rounded-full bg-white p-2 pl-5 shadow-card ring-1 ring-maroon-100 transition focus-within:ring-4 focus-within:ring-gold-400/30"
    >
      <Search className="h-5 w-5 shrink-0 text-maroon-500" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-label={t({ en: 'Search clothes', hi: 'कपड़े खोजें' })}
        placeholder={t({ en: 'Search sarees, suits, kids wear...', hi: 'साड़ी, सूट, बच्चों के कपड़े खोजें...' })}
        className="min-w-0 flex-1 bg-transparent py-2 text-lg text-maroon-900 placeholder:text-maroon-300 focus:outline-none"
      />
      <button type="submit" className="btn-primary px-5 py-2.5 text-base">
        {t({ en: 'Search', hi: 'खोजें' })}
      </button>
    </form>
  );
}

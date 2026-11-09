import { MessageCircle } from 'lucide-react';
import { whatsappLink } from '@/data/shop';
import { useLanguage } from '@/lib/language';

export function WhatsAppButton() {
  const { t } = useLanguage();
  const label = t({ en: 'Chat on WhatsApp', hi: 'WhatsApp पर बात करें' });

  return (
    <a
      href={whatsappLink(t({ en: 'Hello Fashion House, I would like to know more.', hi: 'नमस्ते Fashion House, मुझे और जानकारी चाहिए।' }))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-[#128C3E] px-4 py-3 text-base font-medium text-white shadow-lg shadow-black/20 transition duration-300 hover:-translate-y-1 hover:bg-[#0E7534] hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-[#128C3E]/40 md:px-5"
    >
      <MessageCircle className="h-6 w-6" aria-hidden="true" />
      <span className="hidden md:inline">{label}</span>
    </a>
  );
}

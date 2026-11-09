import { Mail, MapPin, MessageCircle, Phone, Clock } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { SHOP, whatsappLink } from '@/data/shop';
import { useLanguage } from '@/lib/language';

export function ContactPage() {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !message.trim()) {
      setError(t({ en: 'Please enter your name and message.', hi: 'कृपया अपना नाम और संदेश लिखें।' }));
      return;
    }
    setError('');
    const text = `${name.trim()}${phone.trim() ? ` (${phone.trim()})` : ''}: ${message.trim()}`;
    window.open(whatsappLink(text), '_blank', 'noopener,noreferrer');
  };

  const infoItems = [
    { icon: MapPin, label: t({ en: 'Address', hi: 'पता' }), value: t(SHOP.address) },
    { icon: Phone, label: t({ en: 'Phone', hi: 'फ़ोन' }), value: SHOP.phone, href: `tel:+${SHOP.whatsappNumber}` },
    { icon: Mail, label: t({ en: 'Email', hi: 'ईमेल' }), value: SHOP.email, href: `mailto:${SHOP.email}` },
    { icon: Clock, label: t({ en: 'Opening hours', hi: 'खुलने का समय' }), value: t(SHOP.hours) },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-20">
      <div className="flex max-w-2xl flex-col gap-4 pb-12">
        <h1 className="text-4xl font-bold text-maroon-800 md:text-5xl">{t({ en: 'Contact Us', hi: 'संपर्क करें' })}</h1>
        <span className="h-1 w-16 rounded-full bg-gold-500" aria-hidden="true" />
        <p className="text-lg leading-relaxed text-maroon-600">
          {t({
            en: 'Visit the shop, call us, or send us a message. We are happy to help you choose.',
            hi: 'दुकान पर आएँ, फ़ोन करें या संदेश भेजें। आपकी पसंद चुनने में हम खुशी से मदद करेंगे।',
          })}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5 lg:gap-12">
        <div className="flex flex-col gap-4 lg:col-span-2">
          {infoItems.map((item) => (
            <div key={item.label} className="flex gap-4 rounded-3xl bg-white p-5 shadow-card">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-maroon-700 text-gold-400">
                <item.icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-base font-medium text-maroon-500">{item.label}</p>
                {item.href ? (
                  <a href={item.href} className="break-words text-lg text-maroon-900 transition hover:text-gold-700">
                    {item.value}
                  </a>
                ) : (
                  <p className="text-lg text-maroon-900">{item.value}</p>
                )}
              </div>
            </div>
          ))}
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary bg-[#128C3E] hover:bg-[#0E7534]"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            {t({ en: 'Chat on WhatsApp', hi: 'WhatsApp पर बात करें' })}
          </a>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-5 rounded-3xl bg-white p-6 shadow-card md:p-8 lg:col-span-3"
        >
          <div>
            <label htmlFor="contact-name" className="label">
              {t({ en: 'Your name', hi: 'आपका नाम' })}
            </label>
            <input
              id="contact-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="field"
            />
          </div>
          <div>
            <label htmlFor="contact-phone" className="label">
              {t({ en: 'Mobile number (optional)', hi: 'मोबाइल नंबर (वैकल्पिक)' })}
            </label>
            <input
              id="contact-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="field"
            />
          </div>
          <div>
            <label htmlFor="contact-message" className="label">
              {t({ en: 'Message', hi: 'संदेश' })}
            </label>
            <textarea
              id="contact-message"
              rows={5}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="field resize-none"
            />
          </div>
          {error && (
            <p role="alert" className="text-base text-red-700">
              {error}
            </p>
          )}
          <button type="submit" className="btn-primary w-full">
            {t({ en: 'Send on WhatsApp', hi: 'WhatsApp पर भेजें' })}
          </button>
        </form>
      </div>
    </section>
  );
}

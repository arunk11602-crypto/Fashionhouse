import { useState, type FormEvent } from 'react';
import { useLanguage } from '@/lib/language';

export interface BookingFormValues {
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
}

export type BookingFormErrors = Partial<Record<keyof BookingFormValues, string>>;

const MOBILE_PATTERN = /^[6-9]\d{9}$/;
const PIN_PATTERN = /^[1-9]\d{5}$/;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const EMPTY_BOOKING_FORM: BookingFormValues = {
  customerName: '',
  mobile: '',
  whatsappNumber: '',
  email: '',
  address: '',
  city: '',
  pinCode: '',
  preferredContact: 'whatsapp',
  note: '',
  termsAccepted: false,
};

export function validateBookingForm(
  values: BookingFormValues,
  t: (text: { en: string; hi: string }) => string,
): BookingFormErrors {
  const errors: BookingFormErrors = {};
  const mobile = values.mobile.replace(/[\s-]/g, '');
  const whatsapp = values.whatsappNumber.replace(/[\s-]/g, '');
  const email = values.email.trim();

  if (!values.customerName.trim()) {
    errors.customerName = t({ en: 'Please enter your full name', hi: 'कृपया अपना पूरा नाम लिखें' });
  }
  if (!MOBILE_PATTERN.test(mobile)) {
    errors.mobile = t({ en: 'Enter a valid 10-digit mobile number', hi: 'सही 10 अंकों का मोबाइल नंबर लिखें' });
  }
  if (!MOBILE_PATTERN.test(whatsapp)) {
    errors.whatsappNumber = t({ en: 'Enter a valid 10-digit WhatsApp number', hi: 'सही 10 अंकों का WhatsApp नंबर लिखें' });
  }
  if (email && !EMAIL_PATTERN.test(email)) {
    errors.email = t({ en: 'Enter a valid email address', hi: 'सही ईमेल पता लिखें' });
  }
  if (values.address.trim().length < 5) {
    errors.address = t({ en: 'Enter your full address', hi: 'कृपया पूरा पता लिखें' });
  }
  if (values.city.trim().length < 2) {
    errors.city = t({ en: 'Enter your city', hi: 'कृपया शहर का नाम लिखें' });
  }
  if (!PIN_PATTERN.test(values.pinCode.trim())) {
    errors.pinCode = t({ en: 'Enter a valid 6-digit PIN code', hi: 'सही 6 अंकों का PIN कोड लिखें' });
  }
  if (values.note.length > 500) {
    errors.note = t({ en: 'Note must be 500 characters or less', hi: 'संदेश 500 अक्षरों से कम होना चाहिए' });
  }
  if (!values.termsAccepted) {
    errors.termsAccepted = t({
      en: 'Please accept the terms and conditions',
      hi: 'कृपया नियम और शर्तें स्वीकार करें',
    });
  }
  return errors;
}

interface BookingFormProps {
  disabled: boolean;
  onSubmit: (values: BookingFormValues) => void;
}

export function BookingForm({ disabled, onSubmit }: BookingFormProps) {
  const { t } = useLanguage();
  const [values, setValues] = useState<BookingFormValues>(EMPTY_BOOKING_FORM);
  const [errors, setErrors] = useState<BookingFormErrors>({});

  const update = <K extends keyof BookingFormValues>(key: K, value: BookingFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) return;
    const nextErrors = validateBookingForm(values, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(values);
  };

  const fieldClass = (key: keyof BookingFormValues) =>
    `field ${errors[key] ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`;

  const errorText = (key: keyof BookingFormValues) =>
    errors[key] && <p className="mt-2 text-base text-red-700">{errors[key]}</p>;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="bk-name" className="label">{t({ en: 'Full name', hi: 'पूरा नाम' })}</label>
          <input id="bk-name" autoComplete="name" value={values.customerName} onChange={(e) => update('customerName', e.target.value)} className={fieldClass('customerName')} />
          {errorText('customerName')}
        </div>
        <div>
          <label htmlFor="bk-mobile" className="label">{t({ en: 'Mobile number', hi: 'मोबाइल नंबर' })}</label>
          <input id="bk-mobile" type="tel" inputMode="tel" autoComplete="tel" value={values.mobile} onChange={(e) => update('mobile', e.target.value)} className={fieldClass('mobile')} />
          {errorText('mobile')}
        </div>
        <div>
          <label htmlFor="bk-whatsapp" className="label">{t({ en: 'WhatsApp number', hi: 'WhatsApp नंबर' })}</label>
          <input id="bk-whatsapp" type="tel" inputMode="tel" value={values.whatsappNumber} onChange={(e) => update('whatsappNumber', e.target.value)} className={fieldClass('whatsappNumber')} />
          {errorText('whatsappNumber')}
        </div>
        <div>
          <label htmlFor="bk-email" className="label">{t({ en: 'Email (optional)', hi: 'ईमेल (वैकल्पिक)' })}</label>
          <input id="bk-email" type="email" autoComplete="email" value={values.email} onChange={(e) => update('email', e.target.value)} className={fieldClass('email')} />
          {errorText('email')}
        </div>
      </div>

      <div>
        <label htmlFor="bk-address" className="label">{t({ en: 'Full address', hi: 'पूरा पता' })}</label>
        <textarea id="bk-address" rows={2} autoComplete="street-address" value={values.address} onChange={(e) => update('address', e.target.value)} className={`${fieldClass('address')} resize-none`} />
        {errorText('address')}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="bk-city" className="label">{t({ en: 'City', hi: 'शहर' })}</label>
          <input id="bk-city" autoComplete="address-level2" value={values.city} onChange={(e) => update('city', e.target.value)} className={fieldClass('city')} />
          {errorText('city')}
        </div>
        <div>
          <label htmlFor="bk-pin" className="label">{t({ en: 'PIN code', hi: 'PIN कोड' })}</label>
          <input id="bk-pin" inputMode="numeric" autoComplete="postal-code" maxLength={6} value={values.pinCode} onChange={(e) => update('pinCode', e.target.value)} className={fieldClass('pinCode')} />
          {errorText('pinCode')}
        </div>
      </div>

      <div>
        <label htmlFor="bk-contact" className="label">{t({ en: 'Preferred contact method', hi: 'पसंदीदा संपर्क तरीका' })}</label>
        <select id="bk-contact" value={values.preferredContact} onChange={(e) => update('preferredContact', e.target.value as BookingFormValues['preferredContact'])} className="field">
          <option value="whatsapp">WhatsApp</option>
          <option value="phone">{t({ en: 'Phone call', hi: 'फ़ोन कॉल' })}</option>
          <option value="email">{t({ en: 'Email', hi: 'ईमेल' })}</option>
        </select>
      </div>

      <div>
        <label htmlFor="bk-note" className="label">{t({ en: 'Customer note (optional)', hi: 'संदेश (वैकल्पिक)' })}</label>
        <textarea id="bk-note" rows={3} value={values.note} onChange={(e) => update('note', e.target.value)} className={`${fieldClass('note')} resize-none`} />
        {errorText('note')}
      </div>

      <div>
        <label className="flex items-start gap-3 text-base leading-relaxed text-maroon-800">
          <input type="checkbox" checked={values.termsAccepted} onChange={(e) => update('termsAccepted', e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-maroon-700" />
          <span>
            {t({
              en: 'I agree to the terms and conditions. I understand this is a booking request only and no payment is taken online.',
              hi: 'मैं नियम और शर्तों से सहमत हूँ। मैं समझता/समझती हूँ कि यह केवल बुकिंग अनुरोध है और ऑनलाइन भुगतान नहीं लिया जाता।',
            })}
          </span>
        </label>
        {errorText('termsAccepted')}
      </div>

      <button type="submit" disabled={disabled} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60">
        {disabled
          ? t({ en: 'Sending request...', hi: 'अनुरोध भेजा जा रहा है...' })
          : t({ en: 'Submit booking request', hi: 'बुकिंग अनुरोध भेजें' })}
      </button>
    </form>
  );
}

import { useState, type FormEvent } from 'react';
import { Lock } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAdminSession } from '@/lib/admin-session';
import { useLanguage } from '@/lib/language';

export function AdminLoginPage() {
  const { t } = useLanguage();
  const { status, signIn } = useAdminSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === 'admin') return <Navigate to="/admin" replace />;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError(t({ en: 'Enter your email and password.', hi: 'ईमेल और पासवर्ड दर्ज करें।' }));
      return;
    }
    setSubmitting(true);
    setError(null);
    const failure = await signIn(email.trim(), password);
    setSubmitting(false);
    if (failure) {
      setError(
        t({
          en: 'Sign-in failed. Check your email and password, then try again.',
          hi: 'लॉगिन नहीं हो सका। ईमेल और पासवर्ड जाँचकर फिर से कोशिश करें।',
        }),
      );
    }
  };

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-16 md:px-8">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-card animate-fade-up md:p-10">
        <div className="flex flex-col items-center gap-4 pb-8 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-maroon-700 text-gold-400 shadow-md">
            <Lock className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="text-3xl font-bold text-maroon-800">{t({ en: 'Admin Login', hi: 'एडमिन लॉगिन' })}</h1>
          <p className="text-lg text-maroon-600">
            {t({ en: 'For the shop owner only', hi: 'केवल दुकान मालिक के लिए' })}
          </p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="admin-email" className="label">
              {t({ en: 'Email', hi: 'ईमेल' })}
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              className="field"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="label">
              {t({ en: 'Password', hi: 'पासवर्ड' })}
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              className="field"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={submitting}
            />
          </div>
          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-base text-red-800">
              {error}
            </p>
          )}
          <button type="submit" disabled={submitting || status === 'loading'} className="btn-primary w-full">
            {submitting ? t({ en: 'Signing in...', hi: 'लॉगिन हो रहा है...' }) : t({ en: 'Sign in', hi: 'लॉगिन करें' })}
          </button>
        </form>
      </div>
    </section>
  );
}

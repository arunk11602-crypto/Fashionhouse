import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { AdminLoginPage } from '@/pages/AdminLoginPage';
import { AdminPage } from '@/pages/AdminPage';
import { BookingConfirmationPage } from '@/pages/BookingConfirmationPage';
import { BookingPage } from '@/pages/BookingPage';
import { CollectionPage } from '@/pages/CollectionPage';
import { ContactPage } from '@/pages/ContactPage';
import { HomePage } from '@/pages/HomePage';
import { MyBookingPage } from '@/pages/MyBookingPage';
import { CATALOG_PAGES } from '@/lib/navigation';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        {CATALOG_PAGES.map((page) => (
          <Route key={page.path} path={page.path} element={<CollectionPage page={page} />} />
        ))}
        <Route path="/my-booking" element={<MyBookingPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/booking/:code" element={<BookingConfirmationPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;

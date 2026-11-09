import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { BookingListProvider } from '@/lib/booking-list';
import { LanguageProvider } from '@/lib/language';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <BookingListProvider>
          <App />
        </BookingListProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>
);

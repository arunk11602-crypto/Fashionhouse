# Fashion House: go-live checklist

1. **Shop details** – edit `src/data/shop.ts`: WhatsApp number (`whatsappNumber`, country code + 10 digits), phone, email, address and opening hours. They are still sample values.
2. **Sample products** – the database ships with 20 + 12 sample products using stock photos. When your real stock is ready, run `supabase/go-live/unpublish_demo_products.sql` in the Supabase SQL editor (hides them, deletes nothing).
3. **Admin account** – create the owner user in Supabase Auth, then in the SQL editor:
   `UPDATE public.profiles SET role = 'admin' WHERE id = '<owner user id>';`
   Turn off public sign-ups in Supabase Auth settings so nobody else can create accounts.
4. **Migrations** – apply every file in `supabase/migrations`, including `20261109060000_booking_integrity_limits_and_stock_fixes.sql`.
5. **Environment** – `.env` holds `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the anon key is public by design). Never put the `service_role` key in this project, and do not commit `.env`.
6. **Booking rules built in** – one mobile number may have 3 open requests and 5 requests per 24 hours; requests nobody has handled for 72 hours are cancelled and their stock is released. Change the numbers inside `create_booking` / `expire_stale_bookings` if the shop wants different limits.
7. **Optional hardening** – add a CAPTCHA (for example Cloudflare Turnstile) in front of the booking form if bots still become a problem; a database function alone cannot tell a bot from a person.

/*
# Security and performance audit fixes

1. Summary
- Closes a privilege escalation where a signed-in customer could change their own profile role to admin.
- Removes write access that anon never needed on product media.
- Pins the search path on helper and trigger functions.
- Adds indexes on foreign keys that were unindexed and removes two duplicate indexes.

2. Security changes
- profiles: table-wide INSERT, UPDATE and DELETE grants removed for anon and authenticated. Authenticated users keep SELECT and can update only full_name and phone. Row policies are unchanged.
- product_media: anon now has SELECT only.
- set_updated_at, compute_stock_status, products_before_write and product_variants_before_write now run with a fixed search path.

3. Performance changes
- Indexes added on products.created_by, flash_news.created_by, booking_items.product_id, notifications.booking_id, stock_history.actor_id and activity_logs.actor_id.
- Duplicate indexes idx_variants_product and idx_products_category dropped; their twins remain.

4. Notes
- No data is changed or removed.
- All statements are idempotent.
*/

REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, phone) ON public.profiles TO authenticated;

REVOKE ALL ON public.product_media FROM anon;
GRANT SELECT ON public.product_media TO anon;

ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.compute_stock_status(text, integer) SET search_path = public;
ALTER FUNCTION public.products_before_write() SET search_path = public;
ALTER FUNCTION public.product_variants_before_write() SET search_path = public;

CREATE INDEX IF NOT EXISTS idx_products_created_by ON public.products (created_by);
CREATE INDEX IF NOT EXISTS idx_flash_news_created_by ON public.flash_news (created_by);
CREATE INDEX IF NOT EXISTS idx_booking_items_product ON public.booking_items (product_id);
CREATE INDEX IF NOT EXISTS idx_notifications_booking ON public.notifications (booking_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_actor ON public.stock_history (actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor ON public.activity_logs (actor_id);

DROP INDEX IF EXISTS public.idx_variants_product;
DROP INDEX IF EXISTS public.idx_products_category;

/*
# Booking integrity, abuse limits and stock history fixes

## Plain-English summary
Fixes found in a code review:
1. Admin stock edits failed. The stock history table did not accept the "manual_adjustment" label
   that the stock trigger writes, so every admin change to a variant's available stock was rejected.
2. Cancelling or rejecting a booking never gave the reserved pieces back. Now it does, automatically.
   Completing a booking moves its pieces from "booked" to "sold". Cancelled, rejected and completed
   bookings are final and cannot be reopened.
3. Anyone could reserve all stock with scripted requests. create_booking now:
   - limits each mobile number to 3 open (new/pending) bookings and 5 requests per 24 hours,
   - refuses new requests if more than 100 requests arrived in the last hour (flood guard),
   - merges repeated lines for the same variant and checks the merged quantity against the product limit,
   - automatically cancels bookings still "new" after 72 hours (their stock is released).
4. Booking numbers are longer (FH + 12 characters) so they are harder to guess.
5. Admin actions on stock no longer log twice when an admin submits a booking.
6. products_before_write no longer assigns to the generated discount_percentage column (it was ignored).
7. New admin_set_variant_stock(variant, available): lets the admin set a variant's available stock safely.
   Total stock is recalculated in the same step, so it can never drift from available + booked + sold.

## Security
- New helper functions are not callable by visitors or signed-in users.
- create_booking keeps the same signature and the same access (anon + authenticated).

## Notes
- Re-runnable: every statement is idempotent or a CREATE OR REPLACE.
- The 72 hour expiry and the limits are constants inside create_booking / expire_stale_bookings.
*/

-- 1. Stock history accepts every label the app writes
ALTER TABLE public.stock_history DROP CONSTRAINT IF EXISTS stock_history_change_type_check;
ALTER TABLE public.stock_history ADD CONSTRAINT stock_history_change_type_check CHECK (
  change_type IN ('initial', 'restock', 'adjustment', 'manual_adjustment', 'booking', 'booking_cancelled', 'sale')
);

CREATE INDEX IF NOT EXISTS idx_bookings_phone_status ON public.bookings (customer_phone, status);
CREATE INDEX IF NOT EXISTS idx_bookings_status_created ON public.bookings (status, created_at);

-- 2. Admin stock trigger: skip when server functions change stock themselves
CREATE OR REPLACE FUNCTION public.record_variant_stock_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(current_setting('app.skip_stock_history', true), '') = 'on' THEN
    RETURN NULL;
  END IF;
  IF NOT public.is_admin() THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.stock_history (product_id, variant_id, change_type, quantity_change, available_after, note, actor_id)
  VALUES (
    NEW.product_id,
    NEW.id,
    'manual_adjustment',
    NEW.available_quantity - OLD.available_quantity,
    NEW.available_quantity,
    'Stock changed by admin',
    auth.uid()
  );
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_variant_stock_change() FROM PUBLIC, anon, authenticated;

-- 3. Product trigger: status only (discount_percentage is a generated column)
CREATE OR REPLACE FUNCTION public.products_before_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.status := public.compute_stock_status(NEW.status, NEW.available_quantity);
  RETURN NEW;
END;
$$;

-- 4. Booking status changes move stock
CREATE OR REPLACE FUNCTION public.apply_booking_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item record;
  v_available integer;
BEGIN
  IF OLD.status IN ('cancelled', 'rejected', 'completed') THEN
    RAISE EXCEPTION 'booking_status_final';
  END IF;

  PERFORM set_config('app.skip_stock_history', 'on', true);

  IF NEW.status IN ('cancelled', 'rejected') THEN
    FOR v_item IN
      SELECT bi.variant_id, bi.product_id, sum(bi.quantity)::integer AS quantity
      FROM public.booking_items bi
      WHERE bi.booking_id = NEW.id
      GROUP BY bi.variant_id, bi.product_id
      ORDER BY bi.variant_id
    LOOP
      UPDATE public.product_variants
      SET available_quantity = available_quantity + v_item.quantity,
          booked_quantity = booked_quantity - v_item.quantity
      WHERE id = v_item.variant_id
      RETURNING available_quantity INTO v_available;

      INSERT INTO public.stock_history (product_id, variant_id, change_type, quantity_change, available_after, note, actor_id)
      VALUES (v_item.product_id, v_item.variant_id, 'booking_cancelled', v_item.quantity, v_available,
              'Booking ' || NEW.booking_code || ' ' || NEW.status, auth.uid());
    END LOOP;
  ELSIF NEW.status = 'completed' THEN
    FOR v_item IN
      SELECT bi.variant_id, bi.product_id, sum(bi.quantity)::integer AS quantity
      FROM public.booking_items bi
      WHERE bi.booking_id = NEW.id
      GROUP BY bi.variant_id, bi.product_id
      ORDER BY bi.variant_id
    LOOP
      UPDATE public.product_variants
      SET booked_quantity = booked_quantity - v_item.quantity,
          sold_quantity = sold_quantity + v_item.quantity
      WHERE id = v_item.variant_id
      RETURNING available_quantity INTO v_available;

      INSERT INTO public.stock_history (product_id, variant_id, change_type, quantity_change, available_after, note, actor_id)
      VALUES (v_item.product_id, v_item.variant_id, 'sale', 0, v_available,
              'Booking ' || NEW.booking_code || ' completed', auth.uid());
    END LOOP;
  END IF;

  PERFORM set_config('app.skip_stock_history', 'off', true);
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.apply_booking_status_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS bookings_apply_status_change ON public.bookings;
CREATE TRIGGER bookings_apply_status_change
  BEFORE UPDATE OF status ON public.bookings
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.apply_booking_status_change();

-- 5. Unconfirmed bookings expire
CREATE OR REPLACE FUNCTION public.expire_stale_bookings(p_hours integer DEFAULT 72)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff timestamptz := now() - make_interval(hours => greatest(p_hours, 1));
  v_count integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.bookings WHERE status = 'new' AND created_at < v_cutoff) THEN
    RETURN 0;
  END IF;

  PERFORM pg_advisory_xact_lock(7001);

  UPDATE public.bookings
  SET status = 'cancelled'
  WHERE status = 'new' AND created_at < v_cutoff;
  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count > 0 THEN
    INSERT INTO public.activity_logs (action, entity_type, details)
    VALUES ('bookings_expired', 'booking', jsonb_build_object('count', v_count, 'hours', p_hours));
  END IF;
  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.expire_stale_bookings(integer) FROM PUBLIC, anon, authenticated;

-- 6. create_booking with limits
CREATE OR REPLACE FUNCTION public.create_booking(
  p_submission_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_whatsapp_number text,
  p_email text,
  p_address text,
  p_city text,
  p_pin_code text,
  p_preferred_contact text,
  p_note text,
  p_terms_accepted boolean,
  p_items jsonb
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_booking_id uuid;
  v_code text;
  v_line record;
  v_qty integer;
  v_variant product_variants%ROWTYPE;
  v_product products%ROWTYPE;
  v_count integer;
  v_name text := trim(coalesce(p_customer_name, ''));
  v_phone text := coalesce(p_customer_phone, '');
  v_whatsapp text := coalesce(p_whatsapp_number, '');
  v_email text := nullif(trim(coalesce(p_email, '')), '');
  v_address text := trim(coalesce(p_address, ''));
  v_city text := trim(coalesce(p_city, ''));
  v_pin text := trim(coalesce(p_pin_code, ''));
BEGIN
  IF p_submission_id IS NULL THEN
    RAISE EXCEPTION 'invalid_submission';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_submission_id::text, 0));
  SELECT booking_code INTO v_code FROM bookings WHERE submission_id = p_submission_id;
  IF FOUND THEN
    RETURN v_code;
  END IF;

  IF length(v_name) = 0 OR length(v_name) > 100 THEN
    RAISE EXCEPTION 'invalid_name';
  END IF;
  IF v_phone !~ '^[6-9][0-9]{9}$' OR v_whatsapp !~ '^[6-9][0-9]{9}$' THEN
    RAISE EXCEPTION 'invalid_phone';
  END IF;
  IF v_email IS NOT NULL AND (length(v_email) > 254 OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;
  IF length(v_address) < 5 OR length(v_address) > 300 THEN
    RAISE EXCEPTION 'invalid_address';
  END IF;
  IF length(v_city) < 2 OR length(v_city) > 100 THEN
    RAISE EXCEPTION 'invalid_city';
  END IF;
  IF v_pin !~ '^[1-9][0-9]{5}$' THEN
    RAISE EXCEPTION 'invalid_pin';
  END IF;
  IF p_preferred_contact IS NULL OR p_preferred_contact NOT IN ('phone', 'whatsapp', 'email') THEN
    RAISE EXCEPTION 'invalid_contact_method';
  END IF;
  IF length(coalesce(p_note, '')) > 500 THEN
    RAISE EXCEPTION 'invalid_note';
  END IF;
  IF p_terms_accepted IS NOT TRUE THEN
    RAISE EXCEPTION 'terms_not_accepted';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) = 0 OR jsonb_array_length(p_items) > 20 THEN
    RAISE EXCEPTION 'invalid_items';
  END IF;

  -- Abuse limits
  PERFORM pg_advisory_xact_lock(hashtextextended('phone:' || v_phone, 0));

  SELECT count(*) INTO v_count FROM bookings
  WHERE customer_phone = v_phone AND status IN ('new', 'pending');
  IF v_count >= 3 THEN
    RAISE EXCEPTION 'too_many_requests';
  END IF;

  SELECT count(*) INTO v_count FROM bookings
  WHERE customer_phone = v_phone AND created_at > now() - interval '24 hours';
  IF v_count >= 5 THEN
    RAISE EXCEPTION 'too_many_requests';
  END IF;

  SELECT count(*) INTO v_count FROM bookings WHERE created_at > now() - interval '1 hour';
  IF v_count >= 100 THEN
    RAISE EXCEPTION 'too_many_requests';
  END IF;

  -- Release stock held by bookings nobody has looked at for 72 hours
  PERFORM public.expire_stale_bookings(72);

  v_code := 'FH' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));

  INSERT INTO bookings (
    booking_code, submission_id, customer_name, customer_phone, whatsapp_number, email,
    address, city, pin_code, preferred_contact, note, status, terms_accepted_at
  )
  VALUES (
    v_code, p_submission_id, v_name, v_phone, v_whatsapp, v_email,
    v_address, v_city, v_pin, p_preferred_contact, nullif(trim(coalesce(p_note, '')), ''), 'new', now()
  )
  RETURNING id INTO v_booking_id;

  PERFORM set_config('app.skip_stock_history', 'on', true);

  -- One line per variant (repeated lines are merged), locked in a stable order
  FOR v_line IN
    SELECT line.variant_id, line.qty
    FROM (
      SELECT (e.value->>'variant_id') AS variant_text, (e.value->>'quantity') AS qty_text
      FROM jsonb_array_elements(p_items) AS e(value)
    ) AS raw
    CROSS JOIN LATERAL (
      SELECT
        CASE WHEN raw.variant_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
             THEN raw.variant_text::uuid END AS variant_id,
        CASE WHEN raw.qty_text ~ '^[0-9]{1,3}$' THEN raw.qty_text::integer END AS qty
    ) AS line
    ORDER BY line.variant_id
  LOOP
    IF v_line.variant_id IS NULL THEN
      RAISE EXCEPTION 'variant_not_found';
    END IF;
    IF v_line.qty IS NULL OR v_line.qty < 1 THEN
      RAISE EXCEPTION 'invalid_quantity';
    END IF;
  END LOOP;

  FOR v_line IN
    SELECT line.variant_id, sum(line.qty)::integer AS qty
    FROM (
      SELECT (e.value->>'variant_id')::uuid AS variant_id, (e.value->>'quantity')::integer AS qty
      FROM jsonb_array_elements(p_items) AS e(value)
    ) AS line
    GROUP BY line.variant_id
    ORDER BY line.variant_id
  LOOP
    v_qty := v_line.qty;

    SELECT * INTO v_variant FROM product_variants
    WHERE id = v_line.variant_id
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'variant_not_found';
    END IF;

    SELECT * INTO v_product FROM products WHERE id = v_variant.product_id;
    IF NOT v_product.is_published OR v_product.is_archived
       OR v_product.status IN ('Coming Soon', 'Sold Out', 'Booked') THEN
      RAISE EXCEPTION 'variant_not_bookable';
    END IF;
    IF v_qty < v_product.minimum_booking_quantity OR v_qty > v_product.maximum_booking_quantity THEN
      RAISE EXCEPTION 'invalid_quantity';
    END IF;
    IF v_variant.available_quantity < v_qty THEN
      RAISE EXCEPTION 'insufficient_stock';
    END IF;

    UPDATE product_variants
    SET available_quantity = available_quantity - v_qty,
        booked_quantity = booked_quantity + v_qty
    WHERE id = v_variant.id;

    INSERT INTO booking_items (booking_id, variant_id, product_id, quantity, unit_price)
    VALUES (v_booking_id, v_variant.id, v_product.id, v_qty,
            coalesce(v_product.sale_price, v_product.original_price));

    INSERT INTO stock_history (product_id, variant_id, change_type, quantity_change, available_after, note)
    VALUES (v_product.id, v_variant.id, 'booking', -v_qty, v_variant.available_quantity - v_qty,
            'Booking ' || v_code);
  END LOOP;

  PERFORM set_config('app.skip_stock_history', 'off', true);

  INSERT INTO notifications (title, body, type, booking_id)
  VALUES ('New booking request', 'Booking ' || v_code || ' from ' || v_name, 'booking', v_booking_id);

  INSERT INTO activity_logs (action, entity_type, entity_id, details)
  VALUES ('booking_created', 'booking', v_booking_id::text, jsonb_build_object('code', v_code));

  RETURN v_code;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.create_booking(uuid, text, text, text, text, text, text, text, text, text, boolean, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking(uuid, text, text, text, text, text, text, text, text, text, boolean, jsonb) TO anon, authenticated;

-- 7. Admin stock adjustment (race-free: row is locked, total follows available + booked + sold)
CREATE OR REPLACE FUNCTION public.admin_set_variant_stock(p_variant_id uuid, p_available integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not_admin';
  END IF;
  IF p_available IS NULL OR p_available < 0 OR p_available > 100000 THEN
    RAISE EXCEPTION 'invalid_quantity';
  END IF;

  UPDATE public.product_variants
  SET available_quantity = p_available,
      total_quantity = p_available + booked_quantity + sold_quantity
  WHERE id = p_variant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'variant_not_found';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_variant_stock(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_variant_stock(uuid, integer) TO authenticated;

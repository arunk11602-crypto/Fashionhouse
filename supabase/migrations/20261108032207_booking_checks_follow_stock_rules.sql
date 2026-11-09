/*
# Booking checks follow the new stock rules

Plain-English summary
Booking requests now refuse products that are archived, hidden, Coming Soon, Sold Out or Booked. They also respect each product's minimum and maximum booking quantity. Out-of-stock variants are still refused. Everything else about booking is unchanged.

1. Modified Functions
- create_booking: same inputs and outputs. Bookability checks updated for the new status wording and booking limits.

2. Security
- Function unchanged in access: still callable by visitors to submit a booking request, and it still validates all input.

3. Important notes
- Re-runnable: replacing the function again gives the same result.
*/

CREATE OR REPLACE FUNCTION public.create_booking(p_submission_id uuid, p_customer_name text, p_customer_phone text, p_whatsapp_number text, p_email text, p_address text, p_city text, p_pin_code text, p_preferred_contact text, p_note text, p_terms_accepted boolean, p_items jsonb)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
v_booking_id uuid;
v_code text;
v_item jsonb;
v_qty integer;
v_variant product_variants%ROWTYPE;
v_product products%ROWTYPE;
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
IF p_preferred_contact NOT IN ('phone', 'whatsapp', 'email') THEN
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

v_code := 'FH' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

INSERT INTO bookings (
booking_code, submission_id, customer_name, customer_phone, whatsapp_number, email,
address, city, pin_code, preferred_contact, note, status, terms_accepted_at
)
VALUES (
v_code, p_submission_id, v_name, v_phone, v_whatsapp, v_email,
v_address, v_city, v_pin, p_preferred_contact, nullif(trim(coalesce(p_note, '')), ''), 'new', now()
)
RETURNING id INTO v_booking_id;

FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
v_qty := (v_item->>'quantity')::integer;
IF v_qty IS NULL OR v_qty < 1 OR v_qty > 10 THEN
RAISE EXCEPTION 'invalid_quantity';
END IF;

SELECT * INTO v_variant FROM product_variants
WHERE id = (v_item->>'variant_id')::uuid
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

INSERT INTO notifications (title, body, type, booking_id)
VALUES ('New booking request', 'Booking ' || v_code || ' from ' || v_name, 'booking', v_booking_id);

INSERT INTO activity_logs (action, entity_type, entity_id, details)
VALUES ('booking_created', 'booking', v_booking_id::text, jsonb_build_object('code', v_code));

RETURN v_code;
END;
$function$;

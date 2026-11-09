/*
# Product media table and storage buckets

Plain-English summary
Each product can now have several photos and an optional video, stored as separate media records. Files are kept in two private-upload, public-read storage buckets. Only the admin can upload, replace or delete files. When a media record is deleted, its stored file is removed too.

1. New Tables
- product_media: one row per photo or video. Links to a product, has a type (image or video), a web address, an optional storage path, a display order and a primary flag. Existing photo links from products are copied in here once.

2. Storage
- product-images: public read, admin-only upload, replace and delete. JPG, JPEG, PNG and WebP up to 5 MB.
- product-videos: public read, admin-only upload, replace and delete. MP4 and WebM up to 50 MB.
- Files are stored as {product_id}/{unique_filename}.

3. Security
- Row Level Security on product_media: public sees media only for published, non-archived products. Only admins change media.
- Storage upload, replace and delete require the admin check and a valid folder and filename.

4. Important notes
- Re-runnable: each step checks whether it was already applied.
- The earlier image links on products are kept as they were.
*/

CREATE TABLE IF NOT EXISTS public.product_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  media_type text NOT NULL,
  media_url text NOT NULL,
  storage_path text,
  display_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_media_type_check CHECK (media_type IN ('image', 'video'))
);

CREATE INDEX IF NOT EXISTS product_media_product_id_idx ON public.product_media (product_id);
CREATE UNIQUE INDEX IF NOT EXISTS product_media_one_primary_idx ON public.product_media (product_id) WHERE is_primary;

INSERT INTO public.product_media (product_id, media_type, media_url, display_order, is_primary)
SELECT p.id, 'image', u.url, (u.ord - 1)::integer, u.ord = 1
FROM public.products p
CROSS JOIN LATERAL unnest(p.image_urls) WITH ORDINALITY AS u(url, ord)
WHERE NOT EXISTS (
  SELECT 1 FROM public.product_media m WHERE m.product_id = p.id AND m.media_type = 'image'
);

INSERT INTO public.product_media (product_id, media_type, media_url, display_order, is_primary)
SELECT p.id, 'video', p.video_url, 0, false
FROM public.products p
WHERE p.video_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.product_media m WHERE m.product_id = p.id AND m.media_type = 'video'
  );

ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.product_media TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_media TO authenticated;

DROP POLICY IF EXISTS product_media_public_select ON public.product_media;
CREATE POLICY product_media_public_select ON public.product_media FOR SELECT
  TO anon, authenticated USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_media.product_id AND p.is_published AND NOT p.is_archived
    )
  );

DROP POLICY IF EXISTS product_media_admin_insert ON public.product_media;
CREATE POLICY product_media_admin_insert ON public.product_media FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS product_media_admin_update ON public.product_media;
CREATE POLICY product_media_admin_update ON public.product_media FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS product_media_admin_delete ON public.product_media;
CREATE POLICY product_media_admin_delete ON public.product_media FOR DELETE
  TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.delete_product_media_file()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  IF OLD.storage_path IS NOT NULL THEN
    DELETE FROM storage.objects
    WHERE bucket_id = CASE WHEN OLD.media_type = 'video' THEN 'product-videos' ELSE 'product-images' END
      AND name = OLD.storage_path;
  END IF;
  RETURN OLD;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_product_media_file() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS product_media_delete_file ON public.product_media;
CREATE TRIGGER product_media_delete_file AFTER DELETE ON public.product_media
  FOR EACH ROW EXECUTE FUNCTION public.delete_product_media_file();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('product-videos', 'product-videos', true, 52428800, ARRAY['video/mp4', 'video/webm'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "product_media_files_public_read" ON storage.objects;
CREATE POLICY "product_media_files_public_read" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id IN ('product-images', 'product-videos'));

DROP POLICY IF EXISTS "product_media_files_admin_insert" ON storage.objects;
CREATE POLICY "product_media_files_admin_insert" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id IN ('product-images', 'product-videos')
    AND public.is_admin()
    AND name ~ '^[0-9a-fA-F-]{36}/[A-Za-z0-9][A-Za-z0-9._-]{0,200}$'
    AND EXISTS (SELECT 1 FROM public.products p WHERE p.id::text = (storage.foldername(name))[1])
  );

DROP POLICY IF EXISTS "product_media_files_admin_update" ON storage.objects;
CREATE POLICY "product_media_files_admin_update" ON storage.objects FOR UPDATE
  TO authenticated USING (
    bucket_id IN ('product-images', 'product-videos') AND public.is_admin()
  ) WITH CHECK (
    bucket_id IN ('product-images', 'product-videos')
    AND public.is_admin()
    AND name ~ '^[0-9a-fA-F-]{36}/[A-Za-z0-9][A-Za-z0-9._-]{0,200}$'
  );

DROP POLICY IF EXISTS "product_media_files_admin_delete" ON storage.objects;
CREATE POLICY "product_media_files_admin_delete" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id IN ('product-images', 'product-videos') AND public.is_admin()
  );

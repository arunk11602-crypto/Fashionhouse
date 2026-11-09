-- OPTIONAL: run this once in the Supabase SQL editor when the shop is ready to go live with real stock.
-- It hides (does not delete) the sample products so customers no longer see them.
-- Their order history stays intact and you can show them again from Admin > Stock.

UPDATE public.products
SET is_published = false
WHERE is_demo
   OR sku LIKE 'DEMO-%'
   OR sku IN (
     'FH-EW-001','FH-EW-002','FH-EW-003','FH-EW-004','FH-EW-005','FH-EW-006','FH-EW-007','FH-EW-008',
     'FH-FM-009','FH-FM-010','FH-FM-011','FH-WN-012','FH-WW-013','FH-WN-014','FH-WW-015','FH-WW-016',
     'FH-WN-017','FH-WW-018','FH-WW-019','FH-WN-020'
   );

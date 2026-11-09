/*
# Allow admin check inside public read policies

## Plain-English summary
Public read rules on the catalog also allow the owner to see unpublished items. Visitors also evaluate that check, so the check must be runnable by visitors. It always returns false for visitors, so no data is exposed.

## Security
- The admin check function is now executable by the visitor role. It only returns true for signed-in admins listed in admin_users.
*/

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

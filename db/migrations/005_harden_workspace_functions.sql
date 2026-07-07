-- 005: Harden workspace helper function execution.
--
-- These SECURITY DEFINER functions are required internally by triggers/RLS/RPC,
-- but they should not all be directly callable by anonymous browser clients.

-- Trigger-only function: auth.users insert invokes it; no REST/RPC access needed.
revoke execute on function public.handle_new_auth_user() from anon, authenticated, public;

-- Authenticated users may call this RPC to create a workspace; anonymous users may not.
revoke execute on function public.create_company(text) from anon, public;
grant execute on function public.create_company(text) to authenticated;

-- RLS policies call these membership helpers. They can remain executable because
-- they only return membership for auth.uid(), but keep the grants explicit.
revoke execute on function public.is_company_member(uuid) from anon, public;
revoke execute on function public.is_company_admin(uuid) from anon, public;
grant execute on function public.is_company_member(uuid) to authenticated;
grant execute on function public.is_company_admin(uuid) to authenticated;

-- =============================================================================
-- Agent greeting field + self-serve onboarding RPC.
-- =============================================================================

-- The agent's opening line, pushed to VAPI as firstMessage. Personality lives
-- in system_prompt; this is just the greeting.
alter table public.tenants add column if not exists first_message text;

-- -----------------------------------------------------------------------------
-- create_tenant_for_current_user
-- Self-serve onboarding: atomically create a tenant and make the caller its
-- owner. SECURITY DEFINER so it can insert despite RLS, but it only ever links
-- the tenant to auth.uid() — a user can only create a business for themselves.
-- -----------------------------------------------------------------------------
create or replace function public.create_tenant_for_current_user(
  p_name          text,
  p_slug          text,
  p_model         text,
  p_system_prompt text,
  p_first_message text,
  p_voice_config  jsonb
)
returns public.tenants
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_tenant public.tenants;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  insert into public.tenants (name, slug, model, system_prompt, first_message, voice_config)
  values (p_name, p_slug, coalesce(p_model, 'gpt-4o'), p_system_prompt, p_first_message,
          coalesce(p_voice_config, '{}'::jsonb))
  returning * into v_tenant;

  insert into public.tenant_members (tenant_id, user_id, role)
  values (v_tenant.id, v_uid, 'owner');

  return v_tenant;
end;
$$;

grant execute on function public.create_tenant_for_current_user(text, text, text, text, text, jsonb) to authenticated;

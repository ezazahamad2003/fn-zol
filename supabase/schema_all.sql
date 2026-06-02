-- =============================================================
-- ZOL — full schema (paste into Supabase Dashboard -> SQL Editor)
-- Applies: base multi-tenant schema + RLS, agent fields + onboarding
-- RPC, and google_credentials. Safe to run once on a fresh project.
-- =============================================================

-- =============================================================================
-- ZOL — initial schema
-- Multi-tenant from day one. Every domain table carries tenant_id and is
-- protected by RLS. Tenant membership lives in tenant_members.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- tenants
-- Per-tenant VAPI credentials and assistant config live HERE, not in env vars.
-- -----------------------------------------------------------------------------
create table public.tenants (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  slug                text not null unique,
  vapi_assistant_id   text,
  vapi_phone_number   text,
  vapi_phone_id       text,
  model               text not null default 'gpt-4o',
  system_prompt       text,
  voice_config        jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- tenant_members — joins auth.users to tenants for RLS scoping
-- -----------------------------------------------------------------------------
create table public.tenant_members (
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at  timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create index tenant_members_user_idx on public.tenant_members(user_id);

-- -----------------------------------------------------------------------------
-- staff — routing targets for the agent (humans the agent can transfer to)
-- -----------------------------------------------------------------------------
create table public.staff (
  id                   uuid primary key default gen_random_uuid(),
  tenant_id            uuid not null references public.tenants(id) on delete cascade,
  name                 text not null,
  role                 text not null,
  phone                text,
  email                text,
  google_calendar_id   text,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now()
);

create index staff_tenant_idx on public.staff(tenant_id);
create index staff_tenant_role_idx on public.staff(tenant_id, role) where is_active;

-- -----------------------------------------------------------------------------
-- calls — one row per VAPI call
-- -----------------------------------------------------------------------------
create table public.calls (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  vapi_call_id    text unique,
  caller_number   text,
  started_at      timestamptz not null default now(),
  ended_at        timestamptz,
  status          text not null default 'in_progress'
                  check (status in ('in_progress', 'completed', 'failed', 'no_answer')),
  transcript      text,
  summary         text,
  recording_url   text,
  created_at      timestamptz not null default now()
);

create index calls_tenant_started_idx on public.calls(tenant_id, started_at desc);

-- -----------------------------------------------------------------------------
-- tool_calls — every tool invocation. Powers the dashboard run trace.
-- -----------------------------------------------------------------------------
create table public.tool_calls (
  id            uuid primary key default gen_random_uuid(),
  call_id       uuid not null references public.calls(id) on delete cascade,
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  tool_name     text not null,
  input         jsonb not null default '{}'::jsonb,
  output        jsonb,
  duration_ms   integer,
  status        text not null default 'ok' check (status in ('ok', 'error')),
  error         text,
  created_at    timestamptz not null default now()
);

create index tool_calls_call_idx on public.tool_calls(call_id, created_at);
create index tool_calls_tenant_idx on public.tool_calls(tenant_id, created_at desc);

-- -----------------------------------------------------------------------------
-- tasks — follow-ups extracted from calls or created via create_task tool
-- -----------------------------------------------------------------------------
create table public.tasks (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  call_id       uuid references public.calls(id) on delete set null,
  title         text not null,
  description   text,
  assigned_to   uuid references public.staff(id) on delete set null,
  status        text not null default 'open' check (status in ('open', 'done')),
  due_at        timestamptz,
  created_at    timestamptz not null default now()
);

create index tasks_tenant_status_idx on public.tasks(tenant_id, status, created_at desc);

-- -----------------------------------------------------------------------------
-- appointments — Google Calendar bookings created via book_appointment
-- -----------------------------------------------------------------------------
create table public.appointments (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  call_id           uuid references public.calls(id) on delete set null,
  staff_id          uuid references public.staff(id) on delete set null,
  google_event_id   text,
  customer_name     text not null,
  customer_phone    text,
  start_at          timestamptz not null,
  end_at            timestamptz not null,
  purpose           text,
  status            text not null default 'confirmed'
                    check (status in ('confirmed', 'cancelled', 'completed')),
  created_at        timestamptz not null default now()
);

create index appointments_tenant_start_idx on public.appointments(tenant_id, start_at);

-- -----------------------------------------------------------------------------
-- messages — voicemail-style captures created via capture_message
-- -----------------------------------------------------------------------------
create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  call_id         uuid references public.calls(id) on delete set null,
  customer_name   text,
  customer_phone  text,
  body            text not null,
  urgency         text not null default 'normal'
                  check (urgency in ('low', 'normal', 'high', 'urgent')),
  routed_to       uuid references public.staff(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index messages_tenant_idx on public.messages(tenant_id, created_at desc);

-- =============================================================================
-- RLS
-- Every domain table is read/write only by members of the owning tenant.
-- Service role (used by Edge Functions) bypasses RLS automatically.
-- =============================================================================

alter table public.tenants         enable row level security;
alter table public.tenant_members  enable row level security;
alter table public.staff           enable row level security;
alter table public.calls           enable row level security;
alter table public.tool_calls      enable row level security;
alter table public.tasks           enable row level security;
alter table public.appointments    enable row level security;
alter table public.messages        enable row level security;

-- helper: is the current auth user a member of tenant t?
create or replace function public.is_tenant_member(t uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_members
    where tenant_id = t and user_id = auth.uid()
  );
$$;

-- tenants: members can read their tenant row; only owners can update
create policy "tenants: members read"
  on public.tenants for select
  using (public.is_tenant_member(id));

create policy "tenants: owners update"
  on public.tenants for update
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_id = tenants.id
        and user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  );

-- tenant_members: users can see their own memberships
create policy "tenant_members: self read"
  on public.tenant_members for select
  using (user_id = auth.uid());

-- generic per-tenant policies for the rest
create policy "staff: tenant read"          on public.staff          for select using (public.is_tenant_member(tenant_id));
create policy "staff: tenant write"         on public.staff          for all    using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));

create policy "calls: tenant read"          on public.calls          for select using (public.is_tenant_member(tenant_id));
create policy "tool_calls: tenant read"     on public.tool_calls     for select using (public.is_tenant_member(tenant_id));

create policy "tasks: tenant read"          on public.tasks          for select using (public.is_tenant_member(tenant_id));
create policy "tasks: tenant write"         on public.tasks          for all    using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));

create policy "appointments: tenant read"   on public.appointments   for select using (public.is_tenant_member(tenant_id));
create policy "messages: tenant read"       on public.messages       for select using (public.is_tenant_member(tenant_id));

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

-- =============================================================================
-- Per-tenant Google OAuth credentials for Calendar access.
-- One connected Google account per business; staff calendar ids (on the staff
-- table) must be visible to that account. Tokens are sensitive: RLS is ON with
-- NO policies, so ONLY the service role (server actions + edge functions) can
-- read/write them — they never reach the browser.
-- =============================================================================

create table public.google_credentials (
  tenant_id      uuid primary key references public.tenants(id) on delete cascade,
  google_email   text,
  access_token   text,
  refresh_token  text not null,
  token_expiry   timestamptz,
  scope          text,
  connected_by   uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.google_credentials enable row level security;
-- No policies on purpose: service role bypasses RLS; everyone else is denied.

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

-- =============================================================================
-- Self-serve config: booking hours + routing rules + per-staff bookable flag.
-- =============================================================================

-- Per-business booking window + slot length. Shape:
--   { "timezone": "America/New_York", "slotMinutes": 30,
--     "days": { "mon": {"open": true, "start": "09:00", "end": "17:00"}, ... } }
alter table public.tenants add column if not exists booking_config jsonb not null default '{}'::jsonb;

-- Ordered intent -> role rules the agent uses to transfer/route. Shape:
--   [ { "intent": "billing or payment questions", "role": "billing" }, ... ]
alter table public.tenants add column if not exists routing_rules jsonb not null default '[]'::jsonb;

-- Exclude a staff member from being offered for bookings without deactivating
-- them entirely (they can still receive routed calls/messages).
alter table public.staff add column if not exists is_bookable boolean not null default true;

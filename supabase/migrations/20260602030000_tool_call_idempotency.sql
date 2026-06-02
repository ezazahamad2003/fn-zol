-- =============================================================================
-- Idempotency for in-call tool invocations. VAPI may retry a tool webhook;
-- without a dedup key that could double-book an appointment. We store VAPI's
-- per-invocation tool-call id and short-circuit if we've already handled it.
-- =============================================================================

alter table public.tool_calls add column if not exists vapi_tool_call_id text;

create unique index if not exists tool_calls_vapi_tool_call_id_uniq
  on public.tool_calls(vapi_tool_call_id)
  where vapi_tool_call_id is not null;

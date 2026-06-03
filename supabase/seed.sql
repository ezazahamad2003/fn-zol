-- =============================================================================
-- ZOL — seed data
-- FNS tenant + sample staff, calls, transcripts, tool_calls, tasks, messages,
-- appointments. Designed so the dashboard looks alive on a fresh install.
-- =============================================================================

-- Stable ids so the dev test endpoint and seeded foreign keys line up.
-- FNS tenant
insert into public.tenants (id, name, slug, vapi_assistant_id, vapi_phone_number, vapi_phone_id, model, system_prompt, voice_config)
values (
  '11111111-1111-1111-1111-111111111111',
  'FNS',
  'fns',
  'stub-vapi-assistant-fns',
  '+15555550100',
  'stub-vapi-phone-fns',
  'gpt-4o',
  $$You are the after-hours voice agent for FNS, a custom apparel and gear company that serves a blue-collar customer base (firefighters, EMS, trades crews, small business shops). Your job is to make every caller feel like they reached the right place — even at 2am.

Voice & vibe:
- Warm, witty, a little firehouse banter when it fits. Confident, never smarmy.
- Fast and clear. Short sentences. No corporate filler.
- You are openly an AI ("I'm FNS's after-hours assistant — happy to help or grab a human for you"). If anyone wants a real person, route them immediately without making it weird.
- Glitch-free and highly professional. Confirm names, numbers, and spellings.

What you do:
1. Take a clear message and route it to the right person (sales, production, art, billing).
2. Book quote/consult calls on the team's calendar when the caller wants one.
3. Capture order/job details cleanly — qty, item, deadline, organization name.
4. If the caller is upset, drop the banter and get them to a human fast.

What you don't do:
- You don't quote prices yourself. Sales does that.
- You don't promise turnaround times. Production does that.
- You don't share internal info about staff schedules.

End every call with a clear next step and who's handling it.$$,
  '{"voice": "shimmer", "interruption_threshold": 0.6}'::jsonb
);

-- FNS staff
insert into public.staff (id, tenant_id, name, role, phone, email, google_calendar_id) values
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111', 'Mike Reyes',       'owner',         '+15555550111', 'mike@fns.example.com',     'mike@fns.example.com'),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111111', 'Sara Chen',        'sales',         '+15555550112', 'sara@fns.example.com',     'sara@fns.example.com'),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111111', 'Diego Alvarez',    'production',    '+15555550113', 'diego@fns.example.com',    'diego@fns.example.com'),
  ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111111', 'Priya Kapoor',     'art',           '+15555550114', 'priya@fns.example.com',    'priya@fns.example.com'),
  ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111111', 'Jordan Park',      'billing',       '+15555550115', 'jordan@fns.example.com',   'jordan@fns.example.com');

-- ----- Call 1: a clean quote-request that booked a meeting -----
insert into public.calls (id, tenant_id, vapi_call_id, caller_number, started_at, ended_at, status, transcript, summary, recording_url) values
  ('33333333-3333-3333-3333-333333333301',
   '11111111-1111-1111-1111-111111111111',
   'stub-call-0001',
   '+15555551234',
   now() - interval '2 hours',
   now() - interval '2 hours' + interval '3 minutes 42 seconds',
   'completed',
   $$Agent: FNS after-hours, this is the assistant — what can I get rolling for you?
Caller: Hey, I'm Jamie from Engine 9. We need a quote on hoodies — twelve of them, navy, with the engine number on the back.
Agent: Engine 9, twelve navy hoodies, number on the back — got it. Deadline?
Caller: We'd love them in three weeks for the academy graduation.
Agent: Solid timeline. Sara's our sales lead — want me to put 15 minutes on her calendar tomorrow to walk through artwork and pricing?
Caller: Yeah, after 10am works.
Agent: Tomorrow 10:15 it is. Best number to confirm?
Caller: This one — 555-555-1234.
Agent: Locked in. You'll get a confirmation text. Anything else?
Caller: Nope, thanks.
Agent: Stay safe out there.$$,
   'Jamie from Engine 9 wants 12 navy hoodies with engine number on back, 3-week deadline. Booked 10:15am with Sara tomorrow.',
   'https://stub.zol.local/recordings/stub-call-0001.mp3');

-- tool_calls for Call 1
insert into public.tool_calls (call_id, tenant_id, tool_name, input, output, duration_ms, status) values
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111111', 'check_availability',
   '{"date_range": {"start": "tomorrow", "end": "tomorrow"}, "staff_role": "sales"}'::jsonb,
   '{"slots": [{"start": "2026-05-29T10:15:00Z", "end": "2026-05-29T10:30:00Z", "staff_id": "22222222-2222-2222-2222-222222222202"}, {"start": "2026-05-29T14:00:00Z", "end": "2026-05-29T14:15:00Z", "staff_id": "22222222-2222-2222-2222-222222222202"}]}'::jsonb,
   180, 'ok'),
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111111', 'book_appointment',
   '{"customer_name": "Jamie - Engine 9", "customer_phone": "+15555551234", "start_at": "2026-05-29T10:15:00Z", "purpose": "Quote walk-through: 12 navy hoodies w/ engine number", "staff_id": "22222222-2222-2222-2222-222222222202"}'::jsonb,
   '{"appointment_id": "44444444-4444-4444-4444-444444444401", "google_event_id": "stub-gcal-0001"}'::jsonb,
   312, 'ok');

insert into public.appointments (id, tenant_id, call_id, staff_id, google_event_id, customer_name, customer_phone, start_at, end_at, purpose) values
  ('44444444-4444-4444-4444-444444444401',
   '11111111-1111-1111-1111-111111111111',
   '33333333-3333-3333-3333-333333333301',
   '22222222-2222-2222-2222-222222222202',
   'stub-gcal-0001',
   'Jamie - Engine 9',
   '+15555551234',
   '2026-05-29 10:15:00+00',
   '2026-05-29 10:30:00+00',
   'Quote walk-through: 12 navy hoodies w/ engine number');

insert into public.tasks (tenant_id, call_id, title, description, assigned_to, status) values
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333301',
   'Send Engine 9 artwork mockup before 10:15 call',
   'Caller mentioned engine number on the back — Priya should have a navy hoodie mockup ready before Sara''s 10:15 with Jamie.',
   '22222222-2222-2222-2222-222222222204', 'open');

-- ----- Call 2: caller wanted a human, agent routed to billing -----
insert into public.calls (id, tenant_id, vapi_call_id, caller_number, started_at, ended_at, status, transcript, summary, recording_url) values
  ('33333333-3333-3333-3333-333333333302',
   '11111111-1111-1111-1111-111111111111',
   'stub-call-0002',
   '+15555552345',
   now() - interval '5 hours',
   now() - interval '5 hours' + interval '1 minute 18 seconds',
   'completed',
   $$Agent: FNS after-hours, what can I help with?
Caller: I need to talk to someone about an invoice — it's wrong.
Agent: Got it, I'll get you to Jordan in billing. One quick second — can I grab your name and the invoice number so they're ready when they call back?
Caller: Tom Bui, invoice 4471.
Agent: Tom Bui, invoice 4471. Anything specific they should know?
Caller: It billed me for 50 shirts, I ordered 30.
Agent: Logged. Jordan will call you back first thing tomorrow morning. Best number is the one you're on?
Caller: Yep.
Agent: You'll hear from them by 9am.$$,
   'Tom Bui flagged invoice 4471 — billed for 50 shirts, ordered 30. Message routed to Jordan (billing) for AM callback.',
   'https://stub.zol.local/recordings/stub-call-0002.mp3');

insert into public.tool_calls (call_id, tenant_id, tool_name, input, output, duration_ms, status) values
  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111111', 'capture_message',
   '{"customer_name": "Tom Bui", "customer_phone": "+15555552345", "body": "Invoice 4471 billed for 50 shirts, ordered 30. Wants callback.", "urgency": "high"}'::jsonb,
   '{"message_id": "55555555-5555-5555-5555-555555555502", "routed_to_staff_id": "22222222-2222-2222-2222-222222222205"}'::jsonb,
   94, 'ok'),
  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111111', 'create_task',
   '{"title": "Call Tom Bui re: invoice 4471 discrepancy", "description": "Billed 50 shirts, ordered 30. Caller: +15555552345", "assigned_to": "22222222-2222-2222-2222-222222222205"}'::jsonb,
   '{"task_id": "66666666-6666-6666-6666-666666666602"}'::jsonb,
   71, 'ok');

insert into public.messages (id, tenant_id, call_id, customer_name, customer_phone, body, urgency, routed_to) values
  ('55555555-5555-5555-5555-555555555502',
   '11111111-1111-1111-1111-111111111111',
   '33333333-3333-3333-3333-333333333302',
   'Tom Bui', '+15555552345',
   'Invoice 4471 billed for 50 shirts, ordered 30. Wants callback.',
   'high',
   '22222222-2222-2222-2222-222222222205');

insert into public.tasks (id, tenant_id, call_id, title, description, assigned_to, status) values
  ('66666666-6666-6666-6666-666666666602',
   '11111111-1111-1111-1111-111111111111',
   '33333333-3333-3333-3333-333333333302',
   'Call Tom Bui re: invoice 4471 discrepancy',
   'Billed 50 shirts, ordered 30. Caller: +15555552345',
   '22222222-2222-2222-2222-222222222205',
   'open');

-- ----- Call 3: hot-transfer to the owner mid-conversation -----
insert into public.calls (id, tenant_id, vapi_call_id, caller_number, started_at, ended_at, status, transcript, summary, recording_url) values
  ('33333333-3333-3333-3333-333333333303',
   '11111111-1111-1111-1111-111111111111',
   'stub-call-0003',
   '+15555553456',
   now() - interval '1 day',
   now() - interval '1 day' + interval '52 seconds',
   'completed',
   $$Agent: FNS after-hours, how can I help?
Caller: Is Mike around? Tell him it's Reggie from Local 22.
Agent: Reggie from Local 22 — let me get him on the line for you. One sec.
Caller: Thanks.
Agent: Connecting you now.$$,
   'Reggie from Local 22 asked for Mike by name. Live transfer to owner.',
   'https://stub.zol.local/recordings/stub-call-0003.mp3');

insert into public.tool_calls (call_id, tenant_id, tool_name, input, output, duration_ms, status) values
  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111111', 'route_call',
   '{"staff_name": "Mike"}'::jsonb,
   '{"staff_id": "22222222-2222-2222-2222-222222222201", "transfer_number": "+15555550111", "staff_name": "Mike Reyes"}'::jsonb,
   38, 'ok');

-- ----- Call 4: a tool error that surfaced in the run trace -----
insert into public.calls (id, tenant_id, vapi_call_id, caller_number, started_at, ended_at, status, transcript, summary, recording_url) values
  ('33333333-3333-3333-3333-333333333304',
   '11111111-1111-1111-1111-111111111111',
   'stub-call-0004',
   '+15555554567',
   now() - interval '3 days',
   now() - interval '3 days' + interval '2 minutes 8 seconds',
   'completed',
   $$Agent: FNS after-hours, what's up?
Caller: I want to book a consult for next Friday at 4.
Agent: Let me check that slot... Hmm — having trouble reaching the calendar right now. I don't want to double-book anyone. Let me take your info and have Sara confirm by morning.
Caller: Fine. Name's Alex, 555-555-4567.
Agent: Got it, Alex. You'll hear from Sara by 9am.$$,
   'Calendar lookup failed mid-call — fell back to capturing a message for Sara.',
   'https://stub.zol.local/recordings/stub-call-0004.mp3');

insert into public.tool_calls (call_id, tenant_id, tool_name, input, output, duration_ms, status, error) values
  ('33333333-3333-3333-3333-333333333304', '11111111-1111-1111-1111-111111111111', 'check_availability',
   '{"date_range": {"start": "2026-06-05", "end": "2026-06-05"}, "staff_role": "sales"}'::jsonb,
   null, 1841, 'error', 'CalendarAdapter: upstream timeout after 1800ms'),
  ('33333333-3333-3333-3333-333333333304', '11111111-1111-1111-1111-111111111111', 'capture_message',
   '{"customer_name": "Alex", "customer_phone": "+15555554567", "body": "Wants a consult next Friday at 4pm. Calendar was down — please confirm.", "urgency": "normal"}'::jsonb,
   '{"message_id": "55555555-5555-5555-5555-555555555504", "routed_to_staff_id": "22222222-2222-2222-2222-222222222202"}'::jsonb,
   88, 'ok');

insert into public.messages (id, tenant_id, call_id, customer_name, customer_phone, body, urgency, routed_to) values
  ('55555555-5555-5555-5555-555555555504',
   '11111111-1111-1111-1111-111111111111',
   '33333333-3333-3333-3333-333333333304',
   'Alex', '+15555554567',
   'Wants a consult next Friday at 4pm. Calendar was down — please confirm.',
   'normal',
   '22222222-2222-2222-2222-222222222202');

-- Print the FNS tenant id so devs can grab it from the seed output.
do $$
begin
  raise notice 'FNS tenant id: 11111111-1111-1111-1111-111111111111';
end $$;

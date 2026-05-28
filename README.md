# ZOL

Multi-tenant AI voice agent platform. A tenant (a business) gets a dedicated
VAPI voice assistant + phone number. The agent answers their calls 24/7, routes
callers to the right staff, books meetings on Google Calendar, captures
messages, logs full transcripts, and surfaces follow-up tasks. A web dashboard
shows every call, transcript, tool action, and task.

**First tenant:** FNS — an apparel company with a blue-collar customer base.
Agent personality is fun, cheeky, firehouse banter, but glitch-free and highly
professional. Openly an AI; offers a fast track to a human.

> This repo is the **voice core skeleton**. Every external service (VAPI,
> OpenAI, Google Calendar) sits behind a typed adapter with a working stub
> implementation, so the whole app runs end-to-end on seeded data **with no
> real third-party credentials**. Wire real adapters by setting `USE_STUBS=false`
> and filling in the env vars.

## Stack

- **Frontend:** Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui → Vercel
- **Backend / webhooks:** Supabase Edge Functions (Deno)
- **DB + Auth:** Supabase Postgres + Supabase Auth
- **Voice:** VAPI (GPT-4o)
- **Calendar:** Google Calendar API
- **Package manager:** pnpm (workspace)

## Repo layout

```
.
├── apps/
│   └── web/                    # Next.js 14 dashboard
│       ├── app/                # routes (login, dashboard, calls, tasks, messages, settings)
│       ├── components/         # shadcn-style UI + run trace, transcript
│       └── lib/
│           ├── adapters/       # VAPI / Calendar / Model adapters (stub + real seam)
│           ├── tools/          # 5 tools, callable from local dev endpoint
│           └── supabase/       # browser + server Supabase clients
└── supabase/
    ├── migrations/             # schema + RLS
    ├── seed.sql                # FNS tenant + sample data
    └── functions/
        ├── _shared/            # tools, adapters, tenant lookup, log helper
        ├── vapi-tool/          # POST /vapi/tool — mid-call tool dispatcher
        └── vapi-end-of-call/   # POST /vapi/end-of-call — transcript ingest
```

## Setup (stub mode — no real keys required)

Prereqs: Node 20+, pnpm 9, Supabase CLI, Docker (for local Supabase).

```bash
# 1. Install deps
pnpm install

# 2. Configure env (stubs are on by default)
cp .env.local.example apps/web/.env.local

# 3. Start local Supabase + apply schema + seed FNS
supabase start
supabase db reset    # runs migrations + seed.sql

# 4. (optional) Serve edge functions locally
pnpm functions:serve

# 5. Run the dashboard
pnpm dev
```

Open <http://localhost:3000>. You'll land on the dashboard with seeded FNS
calls. Click a call to see the transcript + run trace (every tool call with
input, output, duration, status).

## Trigger tools without VAPI

The dashboard ships with a local dev endpoint that fires any of the 5 tools
against the stubs (and writes the same DB rows the live VAPI webhook would):

```bash
curl -X POST http://localhost:3000/api/dev/trigger \
  -H "content-type: application/json" \
  -d '{
    "tenantId": "<FNS tenant id from seed>",
    "tool": "capture_message",
    "args": {
      "customer_name": "Jamie",
      "customer_phone": "+15555550123",
      "body": "Need a quote on 12 hoodies for Engine 9.",
      "urgency": "normal"
    }
  }'
```

The seed script prints the FNS tenant id when it runs. You can also fire tools
from the **Settings → Dev** panel in the dashboard.

## Going live (wire real services)

Each adapter has a `real.ts` with a `// TODO: wire real <service>` seam:

| Service         | File                                                   |
| --------------- | ------------------------------------------------------ |
| VAPI            | `apps/web/lib/adapters/vapi/real.ts`                   |
| Google Calendar | `apps/web/lib/adapters/calendar/real.ts` + edge twin   |
| OpenAI (model)  | `apps/web/lib/adapters/model/real.ts`                  |

Set `USE_STUBS=false` and fill the matching env vars. The factory in
`apps/web/lib/adapters/index.ts` swaps implementations transparently.

## Architecture principles (non-negotiable)

1. **Multi-tenant from day one.** Every query is scoped by `tenant_id`. FNS is
   the first row, not a hardcoded special case.
2. **Per-tenant VAPI credentials live in the database.** Each tenant's
   `vapi_assistant_id`, `vapi_phone_number`, `vapi_phone_id`, `model`,
   `system_prompt`, `voice_config` are columns on the `tenants` table. The
   `/vapi/tool` handler resolves tenant from the inbound payload.
3. **Tool handlers return in <1–2 seconds.** They run while the caller waits.
   Anything slow is queued and answered immediately.
4. **Every tool call is logged.** `tool_calls` rows capture input, output,
   duration_ms, status, error. Powers the dashboard run trace.
5. **Fail loud.** Errors surface in the run trace; nothing is swallowed.
6. **External services behind adapters.** Swapping stub → real is a one-file
   change, not a refactor.

## Data model

| Table          | Notes                                                                |
| -------------- | -------------------------------------------------------------------- |
| `tenants`      | per-tenant VAPI credentials + system prompt + voice config           |
| `staff`        | routing targets — name, role, phone, email, google_calendar_id       |
| `calls`        | one row per VAPI call — caller, transcript, summary, recording       |
| `tool_calls`   | one row per tool invocation — input, output, duration_ms, status     |
| `tasks`        | follow-ups extracted from calls or created by `create_task`          |
| `appointments` | bookings — google_event_id + customer + start/end                    |
| `messages`     | voicemail-style captures routed to a staff member                    |

All tables have RLS scoped by tenant via a `tenant_members` join.

## License

Private / unreleased.

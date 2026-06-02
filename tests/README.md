# Tests

Behavioral tests for the Supabase edge functions and the web app's security
helpers. The edge functions are Deno, so the suite runs under **Deno** (the web
app's own type safety is covered separately by `pnpm typecheck` in `apps/web`).

## Run

```bash
# from repo root or this folder
cd tests
deno task test
```

Requires Deno 2.x. Install: https://deno.land/  (`curl -fsSL https://deno.land/install.sh | sh`)

The task runs with `--no-check`: the tests execute and assert real behavior,
but full TypeScript checking of the edge functions is delegated to
`supabase functions deploy` (the third-party `@supabase/supabase-js` type graph
needs a node_modules tree that we don't want to vendor just for tests).

## What's covered

| File | Fix / behavior under test |
|------|---------------------------|
| `edge/auth_test.ts` | **Fix #2** — webhook secret fails **closed** in real mode (`USE_STUBS=false`), tolerated only in stub mode |
| `edge/tools_test.ts` | All 5 tool handlers (book/check/route/capture/create) + **idempotency dedup** in `runTool` (a duplicate `vapi_tool_call_id` runs the side effect exactly once) |
| `edge/vapi_tool_test.ts` | **Fix #4** — one tool whose DB write rejects is isolated; the batch still returns 200 instead of 500-ing the whole webhook |
| `edge/vapi_end_of_call_test.ts` | **Fix #3** — compare-and-swap idempotency: a retried end-of-call creates **no duplicate tasks**; task-insert failure surfaces a 500 |
| `web/safe_redirect_test.ts` | **Fix #1** — login callback `?next=` rejects absolute / protocol-relative / scheme URLs (open-redirect guard) |

## How it works

`helpers/mock_supabase.ts` is a small mock of the Supabase query builder. Tests
supply a `responder(spec)` that inspects each query (table, op, filters,
payload) and returns `{ data, error }` — or throws to simulate a transient DB
rejection. Every query is recorded on `db.calls` so tests can assert exactly
which writes happened (e.g. "tasks inserted exactly once across the retry").

The two edge handlers export `handleToolCall(req, supabase)` /
`handleEndOfCall(req, supabase)` and only call `Deno.serve` when run as the
entrypoint (`import.meta.main`), so importing them in tests is side-effect-free.

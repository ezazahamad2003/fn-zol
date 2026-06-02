# Deploying ZOL

ZOL runs fully on **stubs** with no third-party keys (`USE_STUBS=true`). To go
live, stand up the database, deploy the webhooks, set keys, and flip
`USE_STUBS=false`.

## 1. Database (Supabase)

```bash
supabase link --project-ref <your-project-ref>
supabase db push           # applies supabase/migrations/*
# optional: supabase db reset to also load seed.sql locally
```

Migrations include the multi-tenant schema, the `create_tenant_for_current_user`
onboarding RPC, the `first_message` agent field, and `google_credentials`.

## 2. Edge functions (the VAPI webhooks)

```bash
supabase functions deploy vapi-tool vapi-end-of-call

# Secrets the functions read at runtime:
supabase secrets set \
  USE_STUBS=false \
  VAPI_WEBHOOK_SECRET=<same value as the web app> \
  ANTHROPIC_API_KEY=<key> \
  GOOGLE_CLIENT_ID=<id> GOOGLE_CLIENT_SECRET=<secret>
# SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.
```

`verify_jwt = false` is already set for both functions in `supabase/config.toml`
(VAPI can't send a Supabase JWT). They are instead protected by
`VAPI_WEBHOOK_SECRET`, which VAPI sends as `X-Vapi-Secret` on every webhook.

The webhook URLs are derived automatically from `NEXT_PUBLIC_SUPABASE_URL`:
`…/functions/v1/vapi-tool` (tool calls) and `…/functions/v1/vapi-end-of-call`
(end-of-call report). Provisioning wires them onto each assistant.

## 3. Web app (Vercel)

Set the env vars from `.env.local.example` in the Vercel project, with
`USE_STUBS=false` and `NEXT_PUBLIC_APP_URL` = your domain. Auth, onboarding, and
the dashboard are all server-rendered; the build is `pnpm --filter @zol/web build`.

In the **Supabase dashboard → Auth**: set the Site URL + redirect URLs to your
domain (including `https://<domain>/auth/callback`), and decide whether email
confirmation is on (the signup flow handles both).

## 4. Google Calendar (optional, per business)

Create an OAuth 2.0 **Web application** client in Google Cloud Console, enable
the **Google Calendar API**, and add `https://<domain>/api/google/callback` as
an authorized redirect URI. Put the client id/secret + redirect in env. Each
business then clicks **Connect Google Calendar** in Settings. Until configured,
calendar booking stays dormant and the stub is used.

## 5. Verify

See the "Verification" section of the plan: onboard a business → real assistant
+ number appear in VAPI → call the number → tool rows + transcript/tasks show in
the dashboard → edit prompt/voice in Settings and confirm it pushes live.

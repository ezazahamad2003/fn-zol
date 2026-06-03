// Lazily-read env helpers. Server-only values throw if accessed during a
// client render, which keeps service-role keys out of the browser bundle.

const required = (name: string, value: string | undefined): string => {
  if (!value || value.length === 0) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
};

const areaCode = (name: string, value: string | undefined, fallback: string): string => {
  const code = value?.trim() || fallback;
  if (!/^\d{3}$/.test(code)) {
    throw new Error(`${name} must be a 3-digit US area code`);
  }
  return code;
};

export const env = {
  USE_STUBS: (process.env.USE_STUBS ?? "true").toLowerCase() === "true",

  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",

  // Server-only — never reference from client components.
  serviceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),

  vapiApiKey: () => process.env.VAPI_API_KEY ?? "",
  vapiNumberDesiredAreaCode: () => areaCode("VAPI_NUMBER_DESIRED_AREA_CODE", process.env.VAPI_NUMBER_DESIRED_AREA_CODE, "415"),
  // Shared secret VAPI sends as X-Vapi-Secret on webhooks; verified by the
  // edge functions. Optional locally, strongly recommended in production.
  vapiWebhookSecret: () => process.env.VAPI_WEBHOOK_SECRET ?? "",

  openaiApiKey: () => process.env.OPENAI_API_KEY ?? "",
  anthropicApiKey: () => process.env.ANTHROPIC_API_KEY ?? "",

  google: () => ({
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    redirectUri: process.env.GOOGLE_REDIRECT_URI ?? "",
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "",
    serviceAccountPrivateKey: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ?? "",
  }),

  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  // Supabase Edge Functions base — where VAPI sends in-call tool calls and
  // the end-of-call report. Derived from the Supabase project URL.
  functionsBase: () => `${(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "")}/functions/v1`,
};

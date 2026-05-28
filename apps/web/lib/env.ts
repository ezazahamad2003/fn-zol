// Lazily-read env helpers. Server-only values throw if accessed during a
// client render, which keeps service-role keys out of the browser bundle.

const required = (name: string, value: string | undefined): string => {
  if (!value || value.length === 0) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
};

export const env = {
  USE_STUBS: (process.env.USE_STUBS ?? "true").toLowerCase() === "true",

  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",

  // Server-only — never reference from client components.
  serviceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),

  vapiApiKey: () => process.env.VAPI_API_KEY ?? "",
  openaiApiKey: () => process.env.OPENAI_API_KEY ?? "",

  google: () => ({
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "",
    serviceAccountPrivateKey: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ?? "",
  }),

  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};

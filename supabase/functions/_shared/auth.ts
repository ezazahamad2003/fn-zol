// Verify the shared secret VAPI sends on every webhook (set as server.secret
// when provisioning). Only enforced when VAPI_WEBHOOK_SECRET is configured —
// so local/stub setups without a secret keep working.
export function verifyVapiSecret(req: Request): boolean {
  const expected = Deno.env.get("VAPI_WEBHOOK_SECRET") ?? "";
  if (!expected) return true; // not configured → don't enforce
  const got = req.headers.get("x-vapi-secret") ?? "";
  return got === expected;
}

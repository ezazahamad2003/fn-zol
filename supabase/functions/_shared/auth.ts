// Verify the shared secret VAPI sends on every webhook (set as server.secret
// when provisioning). In stub mode (USE_STUBS=true) a missing secret is allowed
// so local setups keep working. In real mode (USE_STUBS=false) the secret is
// mandatory and a missing one fails closed — never silently accept unsigned
// requests in production.
export function verifyVapiSecret(req: Request): boolean {
  const stubMode = (Deno.env.get("USE_STUBS") ?? "true").toLowerCase() === "true";
  const expected = Deno.env.get("VAPI_WEBHOOK_SECRET") ?? "";
  if (!expected) return stubMode; // unset secret: allowed in stub mode only, denied in prod
  const got = req.headers.get("x-vapi-secret") ?? "";
  return got === expected;
}

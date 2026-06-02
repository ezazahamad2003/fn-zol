// Fix #2: webhook secret verification must fail CLOSED in production.
import { assertEquals } from "jsr:@std/assert";
import { verifyVapiSecret } from "../../supabase/functions/_shared/auth.ts";

function reqWith(secret?: string): Request {
  const headers: Record<string, string> = {};
  if (secret !== undefined) headers["x-vapi-secret"] = secret;
  return new Request("https://edge.local/fn", { method: "POST", headers });
}

// Save/restore env so cases don't leak into each other.
function withEnv(env: Record<string, string | undefined>, fn: () => void) {
  const prev: Record<string, string | undefined> = {};
  for (const k of Object.keys(env)) {
    prev[k] = Deno.env.get(k);
    if (env[k] === undefined) Deno.env.delete(k);
    else Deno.env.set(k, env[k]!);
  }
  try { fn(); } finally {
    for (const k of Object.keys(prev)) {
      if (prev[k] === undefined) Deno.env.delete(k);
      else Deno.env.set(k, prev[k]!);
    }
  }
}

Deno.test("accepts a request with the correct secret", () => {
  withEnv({ USE_STUBS: "false", VAPI_WEBHOOK_SECRET: "s3cr3t" }, () => {
    assertEquals(verifyVapiSecret(reqWith("s3cr3t")), true);
  });
});

Deno.test("rejects a request with a wrong secret (prod)", () => {
  withEnv({ USE_STUBS: "false", VAPI_WEBHOOK_SECRET: "s3cr3t" }, () => {
    assertEquals(verifyVapiSecret(reqWith("nope")), false);
  });
});

Deno.test("rejects a request with no secret header (prod)", () => {
  withEnv({ USE_STUBS: "false", VAPI_WEBHOOK_SECRET: "s3cr3t" }, () => {
    assertEquals(verifyVapiSecret(reqWith(undefined)), false);
  });
});

Deno.test("FAILS CLOSED: unset secret in real mode denies all requests", () => {
  withEnv({ USE_STUBS: "false", VAPI_WEBHOOK_SECRET: undefined }, () => {
    assertEquals(verifyVapiSecret(reqWith(undefined)), false);
    assertEquals(verifyVapiSecret(reqWith("anything")), false);
  });
});

Deno.test("stub mode tolerates an unset secret (local dev)", () => {
  withEnv({ USE_STUBS: "true", VAPI_WEBHOOK_SECRET: undefined }, () => {
    assertEquals(verifyVapiSecret(reqWith(undefined)), true);
  });
});

Deno.test("stub mode default (USE_STUBS unset) tolerates unset secret", () => {
  withEnv({ USE_STUBS: undefined, VAPI_WEBHOOK_SECRET: undefined }, () => {
    assertEquals(verifyVapiSecret(reqWith(undefined)), true);
  });
});

Deno.test("a configured secret is still enforced even in stub mode", () => {
  withEnv({ USE_STUBS: "true", VAPI_WEBHOOK_SECRET: "s3cr3t" }, () => {
    assertEquals(verifyVapiSecret(reqWith("wrong")), false);
    assertEquals(verifyVapiSecret(reqWith("s3cr3t")), true);
  });
});

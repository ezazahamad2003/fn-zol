// Fix #1: the login callback's ?next= must never redirect off-site.
import { assertEquals } from "jsr:@std/assert";
import { safeRedirectPath } from "../../apps/web/lib/safe-redirect.ts";

Deno.test("passes through a normal relative path", () => {
  assertEquals(safeRedirectPath("/appointments"), "/appointments");
  assertEquals(safeRedirectPath("/settings?tab=staff"), "/settings?tab=staff");
});

Deno.test("falls back when next is absent", () => {
  assertEquals(safeRedirectPath(null), "/dashboard");
  assertEquals(safeRedirectPath(undefined), "/dashboard");
  assertEquals(safeRedirectPath(""), "/dashboard");
});

Deno.test("BLOCKS absolute URLs (open redirect)", () => {
  assertEquals(safeRedirectPath("https://evil.com"), "/dashboard");
  assertEquals(safeRedirectPath("http://evil.com/phish"), "/dashboard");
});

Deno.test("BLOCKS protocol-relative URLs", () => {
  // new URL("//evil.com", base) resolves to https://evil.com — must be blocked.
  assertEquals(safeRedirectPath("//evil.com"), "/dashboard");
  assertEquals(safeRedirectPath("//evil.com/path"), "/dashboard");
});

Deno.test("BLOCKS backslash trick (/\\evil.com)", () => {
  assertEquals(safeRedirectPath("/\\evil.com"), "/dashboard");
});

Deno.test("BLOCKS scheme-relative without leading slash", () => {
  assertEquals(safeRedirectPath("javascript:alert(1)"), "/dashboard");
  assertEquals(safeRedirectPath("evil.com"), "/dashboard");
});

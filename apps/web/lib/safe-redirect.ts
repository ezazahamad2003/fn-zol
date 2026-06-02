// Returns a safe same-origin redirect target. Only bare relative paths are
// allowed ("/foo"); absolute URLs ("https://evil.com") and protocol-relative
// ones ("//evil.com") are rejected so a crafted ?next= can't redirect a
// just-authenticated user off-site (open-redirect / phishing).
export function safeRedirectPath(requested: string | null | undefined, fallback = "/dashboard"): string {
  if (!requested) return fallback;
  if (!requested.startsWith("/")) return fallback; // not a relative path
  if (requested.startsWith("//")) return fallback; // protocol-relative → external
  if (requested.startsWith("/\\")) return fallback; // backslash trick some browsers treat as //
  return requested;
}

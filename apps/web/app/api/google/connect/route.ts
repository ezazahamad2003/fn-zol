import { NextResponse } from "next/server";
import { getActiveTenant } from "@/lib/tenant-context";
import { buildConsentUrl, googleConfigured } from "@/lib/google/oauth";

// GET /api/google/connect — kicks off the OAuth consent flow for the active
// business. State = tenant id, validated on callback.
export async function GET() {
  if (!googleConfigured()) {
    return NextResponse.json({ error: "Google is not configured (set GOOGLE_* env vars)." }, { status: 400 });
  }
  const tenant = await getActiveTenant();
  if (!tenant) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));

  return NextResponse.redirect(buildConsentUrl(tenant.id));
}

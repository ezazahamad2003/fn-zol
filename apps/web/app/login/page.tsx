"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label } from "@/components/ui/primitives";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);
    if (error) { setError(error.message); return; }
    router.push(next);
    router.refresh();
  }

  async function magicLink() {
    if (!email) { setError("Enter your email first."); return; }
    setPending(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setPending(false);
    if (error) { setError(error.message); return; }
    setMagicSent(true);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-base">Sign in to ZOL</CardTitle>
          <CardDescription>Your AI voice agent dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          {magicSent ? (
            <p className="text-sm text-muted-foreground">
              Check your inbox — we sent a magic sign-in link to <b>{email}</b>.
            </p>
          ) : (
            <form onSubmit={signIn} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-[11px] text-muted-foreground underline">Forgot?</Link>
                </div>
                <Input id="password" type="password" autoComplete="current-password" value={password}
                  onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Signing in…" : "Sign in"}
              </Button>
              <Button type="button" variant="outline" className="w-full" disabled={pending} onClick={magicLink}>
                Email me a magic link
              </Button>
              <div className="text-xs text-muted-foreground text-center pt-2">
                No account? <Link href="/signup" className="underline">Create one</Link>.
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

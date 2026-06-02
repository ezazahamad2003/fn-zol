"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label } from "@/components/ui/primitives";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
    });
    setPending(false);
    if (error) { setError(error.message); return; }
    // If email confirmation is off, a session is returned immediately.
    if (data.session) {
      router.push("/onboarding");
      router.refresh();
    } else {
      setConfirmSent(true);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-base">Create your ZOL account</CardTitle>
          <CardDescription>Set up a voice agent for your business in minutes.</CardDescription>
        </CardHeader>
        <CardContent>
          {confirmSent ? (
            <p className="text-sm text-muted-foreground">
              Almost there — confirm your email at <b>{email}</b>, then you'll land on setup.
            </p>
          ) : (
            <form onSubmit={signUp} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="new-password" minLength={8} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required />
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Creating account…" : "Create account"}
              </Button>
              <div className="text-xs text-muted-foreground text-center pt-2">
                Already have an account? <Link href="/login" className="underline">Sign in</Link>.
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

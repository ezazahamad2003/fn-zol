import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label } from "@/components/ui/primitives";

// Visual-only login for the skeleton. Supabase Auth hookup is straightforward —
// see the // TODO below. We don't want to block local stub-mode usage on auth.
export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-base">Sign in to ZOL</CardTitle>
          <CardDescription>Multi-tenant voice agent dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@company.com" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" />
          </div>
          {/* TODO: wire Supabase Auth — call supabase.auth.signInWithPassword
              and redirect to /dashboard. Add a magic-link option too. */}
          <Button className="w-full" disabled>Sign in (auth not wired)</Button>
          <div className="text-xs text-muted-foreground text-center pt-2">
            Stub mode is on — <Link href="/dashboard" className="underline">enter dashboard</Link>.
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

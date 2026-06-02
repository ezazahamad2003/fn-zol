import Link from "next/link";

export const metadata = {
  title: "ZOL — Your AI voice agent that answers every call",
  description:
    "ZOL answers your business phone 24/7, books appointments, routes callers, takes messages, and logs every call — a tireless front-desk hire that never misses a lead.",
};

const FEATURES = [
  { title: "Answers 24/7", body: "Every call picked up on the first ring — nights, weekends, lunch rushes. No voicemail, no missed leads." },
  { title: "Books appointments", body: "Checks your calendar and locks in the slot while the caller is still on the line." },
  { title: "Routes to the right person", body: "Sales, billing, the owner — the agent connects or notifies whoever matches the request." },
  { title: "Takes messages", body: "Like voicemail, but written down, prioritized by urgency, and delivered to the right staff." },
  { title: "Creates follow-ups", body: "Pulls action items out of the conversation so nothing slips after the call ends." },
  { title: "Logs everything", body: "Searchable transcript, summary, and the exact run trace of what the agent did — in your dashboard." },
];

const STEPS = [
  { n: "1", title: "Sign up", body: "Create your account in seconds." },
  { n: "2", title: "Shape your agent", body: "Name your business, write its personality, and pick how it sounds." },
  { n: "3", title: "Get your number", body: "We provision a phone line and a live voice agent in one click." },
  { n: "4", title: "Go live", body: "Forward your calls. Edit the prompt and voice anytime — changes go live instantly." },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-14">
          <div className="font-semibold tracking-tight text-lg">ZOL</div>
          <nav className="flex items-center gap-2">
            <Link href="/login" className="px-3 py-1.5 rounded-md text-sm hover:bg-muted">Sign in</Link>
            <Link href="/signup" className="px-3 py-1.5 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Low-latency, human-sounding voice AI
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
          The AI receptionist that<br className="hidden sm:block" /> answers every call.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          ZOL picks up your business phone 24/7 — books appointments, routes callers, takes
          messages, and writes down everything it did. A front-desk hire that never sleeps and
          never misses a lead.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/signup" className="px-5 py-2.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90">
            Create your agent
          </Link>
          <Link href="#how" className="px-5 py-2.5 rounded-md text-sm font-medium border border-border hover:bg-muted">
            See how it works
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Set up in minutes · your own phone number · edit anytime</p>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-center">Everything a great front desk does</h2>
        <p className="mt-2 text-sm text-muted-foreground text-center max-w-xl mx-auto">
          Turn inbound calls into booked appointments, routed leads, and tracked follow-ups — automatically.
        </p>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-medium">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-semibold tracking-tight text-center">Live in four steps</h2>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-lg border border-border bg-card p-5">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">{s.n}</div>
                <h3 className="mt-3 font-medium">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Voice quality */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Sounds human. Responds instantly.</h2>
        <p className="mt-3 text-sm text-muted-foreground max-w-2xl mx-auto">
          Built on a best-in-class voice stack tuned for sub-second responses and natural,
          warm conversation. Openly an AI, always able to hand off to a real person — and you
          choose the voice and personality for your brand.
        </p>
        <div className="mt-8">
          <Link href="/signup" className="px-5 py-2.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90">
            Get your number
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} ZOL · AI voice agents for business</div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/login" className="hover:text-foreground">Sign in</Link>
            <Link href="/signup" className="hover:text-foreground">Get started</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

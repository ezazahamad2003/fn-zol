import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "ZOL | Your shop phone assistant",
  description:
    "ZOL answers customer calls, remembers context, books appointments, and keeps operational teams on top of every follow-up.",
};

const CALENDAR_LINK = "https://calendar.app.google/bGNRgCRrbKS8R6Qh6";

const NAV_ITEMS = [
  { href: "#platform", label: "Platform" },
  { href: "#use-cases", label: "Use Cases" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#demo", label: "Demo" },
  { href: "#integrations", label: "Integrations" },
];

const CAPABILITIES = [
  "Answers calls and messages",
  "Remembers customer context",
  "Creates quotes or next steps",
  "Books appointments",
  "Triggers follow-up",
  "Works with existing tools",
];

const PROBLEMS = [
  {
    title: "Calls create hidden work",
    body: "Customers ask for estimates, updates, and appointments, but the next step often lives in someone's notes.",
  },
  {
    title: "Customer context gets scattered",
    body: "Past visits, preferences, and open issues sit across systems, texts, and staff memory.",
  },
  {
    title: "Follow-up is hard to track",
    body: "Callbacks, approvals, parts checks, and schedule changes can stall when the team gets busy.",
  },
  {
    title: "Leads arrive after hours",
    body: "ZOL keeps the front desk open when the team is with customers, at lunch, or done for the day.",
  },
];

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Answer",
    body: "ZOL picks up, understands the caller, and captures the request in a natural conversation.",
  },
  {
    step: "02",
    title: "Organize",
    body: "The conversation becomes customer context, urgency, tasks, and the right operational next step.",
  },
  {
    step: "03",
    title: "Coordinate",
    body: "Appointments, handoffs, messages, and follow-ups move to the team without extra admin work.",
  },
  {
    step: "04",
    title: "Remember",
    body: "Every interaction builds a useful customer timeline so future calls start with context.",
  },
];

const INTELLIGENCE = [
  "Customer timelines",
  "Work histories",
  "Calendar updates",
  "Action items",
  "Follow-up actions",
  "Business signals",
  "Urgent issues",
  "Team notifications",
];

const USE_CASES = [
  "Auto repair shops",
  "Home service teams",
  "Medical and wellness offices",
  "Customer support desks",
  "Local service businesses",
  "Any team that lives on the phone",
];

function ArrowRightIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function CheckIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.2"
      viewBox="0 0 24 24"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function SparkIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
      <path d="M20 2v4" />
      <path d="M22 4h-4" />
      <circle cx="4" cy="20" r="2" />
    </svg>
  );
}

function ZolLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <img
      alt=""
      aria-hidden="true"
      className={`${className} rounded-full object-cover shadow-sm ring-1 ring-black/5`}
      src="/zol-logo.png"
    />
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex w-fit max-w-[calc(100vw-2rem)] items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white/85 px-3 py-1.5 text-center text-[10px] font-semibold uppercase leading-5 tracking-[0.08em] text-emerald-700 shadow-sm backdrop-blur sm:max-w-[92vw] sm:text-xs sm:tracking-[0.16em]">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
      <span className="min-w-0 whitespace-normal">{children}</span>
    </div>
  );
}

function CalendarButton({
  children,
  variant = "dark",
}: {
  children: ReactNode;
  variant?: "dark" | "green" | "light";
}) {
  const styles = {
    dark: "bg-zinc-950 text-white shadow-[0_14px_40px_rgba(15,23,42,0.2)] hover:bg-zinc-800",
    green: "bg-emerald-600 text-white shadow-[0_14px_40px_rgba(5,150,105,0.28)] hover:bg-emerald-700",
    light: "bg-white text-zinc-950 shadow-[0_14px_40px_rgba(15,23,42,0.12)] hover:bg-zinc-50",
  };

  return (
    <a
      className={`inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 text-sm font-semibold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 sm:w-auto ${styles[variant]}`}
      href={CALENDAR_LINK}
      rel="noreferrer"
      target="_blank"
    >
      {children}
      <ArrowRightIcon />
    </a>
  );
}

function SectionIntro({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <Badge>{eyebrow}</Badge>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-base leading-8 text-zinc-600 sm:text-lg">{body}</p>
    </div>
  );
}

function HeroConsole() {
  const waveBars = ["h-4", "h-7", "h-5", "h-9", "h-6", "h-10", "h-8", "h-5", "h-11", "h-7", "h-4", "h-8", "h-10", "h-6", "h-9", "h-5", "h-7", "h-4"];

  return (
    <div className="w-full min-w-0 max-w-6xl">
      <div className="relative">
        <div className="absolute -inset-8 rounded-[2rem] bg-emerald-500/10 blur-3xl" />
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 p-3 text-white shadow-[0_32px_110px_rgba(15,23,42,0.28)] sm:p-4">
          <div className="mb-3 flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-3">
              <ZolLogo className="h-8 w-8" />
              <div>
                <p className="text-sm font-semibold">ZOL Operations OS</p>
                <p className="text-xs text-zinc-400">Operational intelligence active</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Live
            </span>
          </div>

          <div className="grid gap-3 lg:grid-cols-[0.9fr_1.2fr_0.95fr]">
            <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Live Incoming Call
              </p>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold">Sarah Mitchell</h3>
                  <p className="text-sm text-zinc-300">2018 Toyota Camry</p>
                </div>
                <div className="rounded-lg bg-black/25 p-3">
                  <div className="flex h-12 items-end gap-1.5">
                    {waveBars.map((height, index) => (
                      <span
                        className={`w-1 rounded-full bg-emerald-400/85 ${height}`}
                        key={`${height}-${index}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="grid gap-3">
                  {[
                    ["Issue", "Grinding noise while braking", "text-white"],
                    ["Urgency", "High", "text-orange-300"],
                    ["Status", "AI capturing repair details", "text-white"],
                  ].map(([label, value, color]) => (
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3" key={label}>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {label}
                      </p>
                      <p className={`mt-1 text-sm font-semibold ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white p-4 text-zinc-950">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                AI Action Plan
              </p>
              <p className="text-sm leading-6 text-zinc-700">
                ZOL captures the request, prepares the right next step, books the appointment,
                and keeps the team informed.
              </p>
              <div className="mt-5 rounded-lg bg-zinc-50 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Automated Next Steps
                </p>
                <ul className="space-y-3 text-sm text-zinc-700">
                  {[
                    "Create quote or estimate when needed",
                    "Book the appointment on the calendar",
                    "Notify the team with customer context",
                  ].map((item) => (
                    <li className="flex items-center gap-3" key={item}>
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <CheckIcon />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-4 h-1.5 rounded-full bg-zinc-100">
                <div className="h-full w-3/4 rounded-full bg-emerald-500" />
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Customer Memory
              </p>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-white">Previous Visits</p>
                  <div className="mt-3 space-y-2 text-sm text-zinc-300">
                    <p>Oil change - 3 months ago</p>
                    <p>Brake vibration inspection - 8 months ago</p>
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                    Customer Notes
                  </p>
                  <p className="mt-2 text-sm text-zinc-200">Prefers text communication</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.06] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Operations Intelligence
              </p>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                Updated now
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                ["Tomorrow", "12 appointments"],
                ["Estimates", "3 pending"],
                ["Callbacks", "2 urgent"],
                ["Follow-up", "1 overdue"],
              ].map(([label, value]) => (
                <div className="rounded-lg bg-black/20 p-3" key={label}>
                  <p className="text-xs text-zinc-500">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-zinc-950">
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
        <nav className="mx-auto flex w-full min-w-0 max-w-7xl items-center justify-between rounded-full border border-transparent bg-white/70 px-4 py-3 backdrop-blur-md transition-all duration-300 sm:px-5">
          <Link aria-label="ZOL home" className="flex shrink-0 items-center gap-3" href="/">
            <ZolLogo />
            <span className="text-lg font-bold tracking-tight text-zinc-950">ZOL</span>
          </Link>

          <div className="hidden items-center gap-1 rounded-full bg-zinc-100/80 p-1 lg:flex">
            {NAV_ITEMS.map((item) => (
              <a
                className="rounded-full px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-white hover:text-zinc-950"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              className="hidden rounded-full px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 sm:inline-flex"
              href="/login"
            >
              Sign in
            </Link>
            <a
              className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-950 px-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 sm:px-4"
              href={CALENDAR_LINK}
              rel="noreferrer"
              target="_blank"
            >
              <span className="hidden sm:inline">Book demo</span>
              <span className="sm:hidden">Demo</span>
            </a>
          </div>
        </nav>
      </header>

      <section className="relative overflow-hidden px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 lg:px-8 lg:pb-28 lg:pt-40">
        <div className="industrial-grid absolute inset-x-0 top-0 h-[56rem] opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="relative mx-auto flex w-full min-w-0 max-w-7xl flex-col items-center gap-10 sm:gap-14">
          <div className="mx-auto w-full min-w-0 max-w-5xl text-center">
            <Badge>Operational Intelligence For Customer-Facing Businesses</Badge>
            <h1 className="mx-auto mt-5 max-w-4xl text-[clamp(2.5rem,7vw,4rem)] font-semibold leading-[0.98] tracking-tight text-zinc-950">
              Your Business&apos;s First AI Employee
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg sm:leading-8">
              ZOL answers calls, remembers customers, and turns conversations into organized
              operational intelligence.
              <span className="mx-auto mt-3 block max-w-xl text-sm font-medium leading-6 text-zinc-500 sm:text-base sm:leading-7">
                Reduce chaos, move faster, and keep every customer interaction connected.
              </span>
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <CalendarButton>Book Demo</CalendarButton>
              <a
                className="inline-flex h-12 w-full items-center justify-center rounded-full border border-zinc-200 bg-white px-6 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-950 sm:w-auto"
                href="#platform"
              >
                See Platform
              </a>
            </div>

            <div className="mx-auto mt-7 grid max-w-4xl gap-3 text-left text-sm font-medium text-zinc-700 sm:grid-cols-2 lg:grid-cols-3">
              {CAPABILITIES.map((item) => (
                <div className="flex items-center gap-2" key={item}>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <CheckIcon />
                  </span>
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm font-semibold text-zinc-500">
              No complicated setup. Works alongside your existing workflow.
            </p>
          </div>

          <HeroConsole />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionIntro
          body="Calls, notes, after-hours requests, team updates, and customer concerns create work that is easy to miss and hard to track."
          eyebrow="The Operating Problem"
          title="Operational businesses run on conversations, but conversations get lost."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {PROBLEMS.map((problem) => (
            <div
              className="h-full rounded-lg border border-zinc-200/80 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
              key={problem.title}
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-950 text-white">
                <SparkIcon className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-950">{problem.title}</h3>
              <p className="mt-4 text-sm leading-7 text-zinc-600">{problem.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="platform" className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <Badge>Platform</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl">
              One AI employee for the messy work around customer conversations.
            </h2>
            <p className="mt-5 text-base leading-8 text-zinc-600 sm:text-lg">
              ZOL is built for operational teams that need every call, customer detail, and
              next step to become visible work.
            </p>
            <div className="mt-8">
              <CalendarButton>Book Demo</CalendarButton>
            </div>
          </div>

          <div className="rounded-[2rem] bg-zinc-950 p-4 text-white shadow-[0_30px_90px_rgba(15,23,42,0.2)]">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ZolLogo className="h-9 w-9" />
                  <div>
                    <p className="text-sm font-semibold">Customer intelligence</p>
                    <p className="text-xs text-zinc-400">Always building context</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                  Synced
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {INTELLIGENCE.map((item) => (
                  <div className="rounded-lg bg-white p-5 text-zinc-950" key={item}>
                    <p className="text-sm font-semibold">{item}</p>
                    <p className="mt-3 text-sm leading-6 text-zinc-600">
                      Captured and routed into the workflow your team already uses.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="use-cases" className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionIntro
          body="ZOL fits teams where calls create work, appointments matter, and customer context needs to follow every handoff."
          eyebrow="Use Cases"
          title="Built for teams that cannot afford to miss the next step."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {USE_CASES.map((useCase) => (
            <div
              className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-5 text-sm font-semibold text-zinc-800 shadow-[0_14px_36px_rgba(15,23,42,0.05)]"
              key={useCase}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckIcon />
              </span>
              {useCase}
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionIntro
          body="Your team keeps working normally. ZOL handles the capture, coordination, and follow-through around them."
          eyebrow="How It Works"
          title="Easy for operational teams to adopt."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-4">
          {WORKFLOW_STEPS.map((step) => (
            <div
              className="h-full rounded-lg border border-zinc-200/80 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
              key={step.step}
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-950 text-sm font-semibold text-white">
                {step.step}
              </div>
              <h3 className="text-xl font-semibold text-zinc-950">{step.title}</h3>
              <p className="mt-4 text-sm leading-7 text-zinc-600">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="integrations" className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 rounded-[2rem] bg-zinc-50 px-6 py-14 sm:px-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <Badge>Integrations</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              Works alongside the tools your team already trusts.
            </h2>
            <p className="mt-5 text-base leading-8 text-zinc-600">
              ZOL can coordinate around calendars, messages, tasks, customer records, and the
              operational systems that keep your team moving.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Calendar", "Customer notes", "Team messages", "Task handoffs", "Call records", "Follow-up queues"].map(
              (item) => (
                <div className="rounded-lg bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)]" key={item}>
                  <p className="text-sm font-semibold text-zinc-950">{item}</p>
                  <p className="mt-3 text-sm leading-6 text-zinc-600">
                    Connected context without changing how the team works.
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section id="demo" className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Badge>Demo</Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl">
            Book a demo with ZOL.
          </h2>
          <p className="mt-5 text-base leading-8 text-zinc-600 sm:text-lg">
            Pick a time on our calendar and we will walk through how ZOL can answer calls,
            coordinate work, and keep your team moving.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-4xl rounded-[2rem] border border-zinc-200/80 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.09)] sm:p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div className="space-y-4">
              {[
                "Choose a time that works for you",
                "Get a tailored walkthrough of ZOL",
                "No name, email, phone, or business form required",
              ].map((item) => (
                <div className="flex items-center gap-3 text-sm font-medium text-zinc-700" key={item}>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <CheckIcon />
                  </span>
                  {item}
                </div>
              ))}
            </div>
            <CalendarButton>Open Calendar</CalendarButton>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-zinc-950 px-6 py-16 text-center shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:px-10 lg:py-20">
          <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="relative mx-auto max-w-4xl">
            <SparkIcon className="mx-auto mb-5 h-7 w-7 text-emerald-300" />
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              The next generation of operational businesses will run on AI employee infrastructure.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-zinc-300">
              ZOL helps customer-facing teams organize communication, reduce chaos, and operate
              with real-time intelligence.
            </p>
            <div className="mt-8 flex justify-center">
              <CalendarButton variant="green">Book Demo</CalendarButton>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <ZolLogo />
            <div>
              <p className="text-lg font-bold tracking-tight text-zinc-950">ZOL</p>
              <p className="mt-1 text-sm text-zinc-500">
                AI employee platform for operational businesses
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-5 text-sm font-medium text-zinc-600">
            <Link className="hover:text-zinc-950" href="/privacy">
              Privacy
            </Link>
            <Link className="hover:text-zinc-950" href="/terms">
              Terms
            </Link>
            <Link className="hover:text-zinc-950" href="/login">
              Sign in
            </Link>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-7xl text-sm text-zinc-400">
          &copy; {new Date().getFullYear()} ZOL
        </div>
      </footer>
    </main>
  );
}

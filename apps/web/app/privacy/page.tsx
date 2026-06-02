import Link from "next/link";

export const metadata = { title: "Privacy Policy — ZOL" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="text-xs text-muted-foreground hover:underline">← Back to ZOL</Link>
      <h1 className="text-2xl font-semibold mt-4">Privacy Policy</h1>
      <p className="text-xs text-muted-foreground mt-1">Last updated: June 2026</p>

      <div className="prose prose-sm mt-6 space-y-5 text-sm leading-relaxed">
        <p>
          ZOL provides an AI voice agent that answers calls on behalf of businesses (&quot;Customers&quot;). This
          policy explains what we collect and how we use it. It is a starting template and should be
          reviewed by your legal counsel before launch.
        </p>

        <Section title="What we collect">
          <ul className="list-disc pl-5 space-y-1">
            <li><b>Account data</b> — your email and authentication details.</li>
            <li><b>Business configuration</b> — agent personality, voice, staff, hours, and routing rules you set.</li>
            <li><b>Call data</b> — phone numbers, call recordings, transcripts, summaries, and the actions the agent took (appointments, messages, tasks).</li>
            <li><b>Usage + logs</b> — technical logs needed to operate and secure the service.</li>
          </ul>
        </Section>

        <Section title="Call recording">
          <p>
            Calls handled by the agent may be recorded and transcribed. The agent discloses this at the start
            of the call. Customers are responsible for ensuring recording complies with the laws of the
            jurisdictions where their callers are located (some require all-party consent).
          </p>
        </Section>

        <Section title="How we use data">
          <p>
            To operate the agent, transcribe and summarize calls, book appointments, route callers, and show
            results in the dashboard. We use third-party processors — including the voice platform (VAPI),
            speech and language model providers (e.g. OpenAI), and Google Calendar when a Customer connects it —
            solely to provide the service.
          </p>
        </Section>

        <Section title="Data sharing & retention">
          <p>
            We do not sell personal data. Data is shared only with the processors above and is retained for as
            long as a Customer&apos;s account is active or as required by law. Customers can request deletion.
          </p>
        </Section>

        <Section title="Security">
          <p>
            Data is isolated per business and protected by row-level security. Secrets are stored server-side
            and never exposed to the browser. Access tokens for connected services are restricted to backend
            processes.
          </p>
        </Section>

        <Section title="Contact">
          <p>Questions: <a className="underline" href="mailto:privacy@example.com">privacy@example.com</a>.</p>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-1.5 text-muted-foreground">{children}</div>
    </section>
  );
}

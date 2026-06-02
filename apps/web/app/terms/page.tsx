import Link from "next/link";

export const metadata = { title: "Terms of Service — ZOL" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="text-xs text-muted-foreground hover:underline">← Back to ZOL</Link>
      <h1 className="text-2xl font-semibold mt-4">Terms of Service</h1>
      <p className="text-xs text-muted-foreground mt-1">Last updated: June 2026</p>

      <div className="mt-6 space-y-5 text-sm leading-relaxed">
        <p>
          These terms govern use of ZOL. This is a starting template and should be reviewed by your legal
          counsel before launch.
        </p>

        <Section title="The service">
          <p>
            ZOL provisions an AI voice agent and phone number for your business and logs call activity in a
            dashboard. Availability depends on third-party providers (telephony, speech, and language models)
            and is provided on an &quot;as is&quot; basis.
          </p>
        </Section>

        <Section title="Your responsibilities">
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide accurate business and staff information.</li>
            <li>Ensure call recording and outreach comply with applicable laws in your callers&apos; jurisdictions.</li>
            <li>Keep your account credentials secure and use the service lawfully.</li>
            <li>Obtain any consents required to book on connected calendars and contact your customers.</li>
          </ul>
        </Section>

        <Section title="Acceptable use">
          <p>
            No unlawful, deceptive, or abusive use; no using the agent to mislead callers about its AI nature
            beyond what the law allows. We may suspend accounts that violate these terms.
          </p>
        </Section>

        <Section title="Fees & third parties">
          <p>
            Usage may incur provider costs (telephony minutes, model usage). You are responsible for fees
            associated with your account and connected providers.
          </p>
        </Section>

        <Section title="Liability">
          <p>
            To the maximum extent permitted by law, ZOL is not liable for indirect or consequential damages,
            or for actions taken by the AI agent during calls. Verify critical outcomes (bookings, messages)
            in your dashboard.
          </p>
        </Section>

        <Section title="Contact">
          <p>Questions: <a className="underline" href="mailto:support@example.com">support@example.com</a>.</p>
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

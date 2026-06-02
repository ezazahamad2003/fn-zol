// Deno twin of apps/web/lib/adapters/model/real.ts — extracts follow-up tasks
// from a finished call via Claude. Fails soft (returns []) so a model hiccup
// never blocks persisting the call.

export type ExtractedTask = { title: string; description?: string };

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM = `You extract concrete follow-up tasks from a phone call between a business's AI receptionist and a caller.
Return ONLY tasks that require a human to do something after the call.
Do not invent tasks. If nothing needs following up, return an empty list.`;

export async function extractTasks(transcript: string, summary: string | null): Promise<ExtractedTask[]> {
  const key = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
  if (!key) return regexFallback(transcript, summary);
  if (!transcript && !summary) return [];

  const userContent = [
    summary ? `Call summary:\n${summary}` : null,
    transcript ? `Transcript:\n${transcript.slice(0, 12000)}` : null,
    `\nReturn a JSON object: {"tasks":[{"title":"...","description":"..."}]}. title is required and short.`,
  ].filter(Boolean).join("\n\n");

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM,
        messages: [{ role: "user", content: userContent }],
      }),
    });
    if (!res.ok) return regexFallback(transcript, summary);
    const data = await res.json();
    const text: string = data?.content?.[0]?.text ?? "";
    const parsed = parseTasks(text);
    return parsed.length > 0 ? parsed : regexFallback(transcript, summary);
  } catch {
    return regexFallback(transcript, summary);
  }
}

function parseTasks(text: string): ExtractedTask[] {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]);
    const tasks = Array.isArray(parsed?.tasks) ? parsed.tasks : [];
    return tasks
      .filter((t: { title?: string }) => Boolean(t?.title))
      .map((t: { title: string; description?: string }) => ({
        title: String(t.title).slice(0, 200),
        description: t.description ? String(t.description) : undefined,
      }))
      .slice(0, 10);
  } catch {
    return [];
  }
}

// Used when no model key is configured (e.g. stub mode) or the call fails.
function regexFallback(transcript: string, summary: string | null): ExtractedTask[] {
  const trigger = /\b(send|follow up|call back|email|confirm|prepare|ship|schedule|quote|invoice)\b/i;
  const out: ExtractedTask[] = [];
  for (const raw of (transcript ?? "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (trigger.test(line) && line.length < 220) {
      const title = line.replace(/^(Agent|Caller):\s*/i, "").slice(0, 100);
      if (title.length > 12) out.push({ title });
    }
    if (out.length >= 3) break;
  }
  if (out.length === 0 && summary) out.push({ title: `Follow up: ${summary.slice(0, 80)}` });
  return out;
}

import type { ModelAdapter, ExtractedTask } from "@/lib/adapters/types";
import { env } from "@/lib/env";

// Real extractor — calls Claude (Haiku: fast + cheap) once per call after
// hangup to pull out concrete follow-up tasks. Runs in the background, so we
// fail soft (return []) rather than throw and break the end-of-call flow.

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM = `You extract concrete follow-up tasks from a phone call between a business's AI receptionist and a caller.
Return ONLY tasks that require a human to do something after the call (send a quote, call back, ship an item, confirm a detail).
Do not invent tasks. If nothing needs following up, return an empty list.`;

export const modelReal: ModelAdapter = {
  async extractTasks({ transcript, summary }): Promise<ExtractedTask[]> {
    const key = env.anthropicApiKey();
    if (!key) return [];
    if (!transcript && !summary) return [];

    const userContent = [
      summary ? `Call summary:\n${summary}` : null,
      transcript ? `Transcript:\n${transcript.slice(0, 12000)}` : null,
      `\nReturn a JSON object: {"tasks":[{"title":"...","description":"...","assignee_hint":"..."}]}.`,
      `title is required and short. description and assignee_hint are optional.`,
    ].filter(Boolean).join("\n\n");

    try {
      const res = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1024,
          system: SYSTEM,
          messages: [{ role: "user", content: userContent }],
        }),
      });
      if (!res.ok) return [];
      const data = await res.json();
      const text: string = data?.content?.[0]?.text ?? "";
      return parseTasks(text);
    } catch {
      return [];
    }
  },
};

// Pull the JSON object out of the model's reply (tolerant of prose around it).
function parseTasks(text: string): ExtractedTask[] {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]);
    const tasks = Array.isArray(parsed?.tasks) ? parsed.tasks : [];
    return tasks
      .filter((t: unknown): t is { title: string } => Boolean((t as { title?: string })?.title))
      .map((t: { title: string; description?: string; assignee_hint?: string }) => ({
        title: String(t.title).slice(0, 200),
        description: t.description ? String(t.description) : undefined,
        assignee_hint: t.assignee_hint ? String(t.assignee_hint) : undefined,
      }))
      .slice(0, 10);
  } catch {
    return [];
  }
}

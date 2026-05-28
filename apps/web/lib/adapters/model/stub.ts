import type { ModelAdapter, ExtractedTask } from "@/lib/adapters/types";

// Cheap heuristic extractor: scan transcript lines for verbs that suggest a
// follow-up. Good enough for stub data; the real adapter calls GPT-4o.
const TRIGGER_RE = /\b(send|follow up|call back|email|confirm|prepare|ship|schedule|quote|invoice)\b/i;

export const modelStub: ModelAdapter = {
  async extractTasks({ transcript, summary }): Promise<ExtractedTask[]> {
    const out: ExtractedTask[] = [];
    const lines = (transcript ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (TRIGGER_RE.test(line) && line.length < 220) {
        const title = line.replace(/^(Agent|Caller):\s*/i, "").slice(0, 100);
        if (title.length > 12) out.push({ title });
      }
      if (out.length >= 3) break;
    }
    if (out.length === 0 && summary) {
      out.push({ title: `Follow up: ${summary.slice(0, 80)}` });
    }
    return out;
  },
};

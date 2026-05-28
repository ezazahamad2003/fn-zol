import type { ModelAdapter, ExtractedTask } from "@/lib/adapters/types";

// TODO: wire OpenAI (or any LLM).
// Use GPT-4o with a structured-output schema:
//   tasks: { title: string; description?: string; assignee_hint?: string }[]
// Keep this prompt small — it runs once per call, post-hangup.

export const modelReal: ModelAdapter = {
  async extractTasks(_input): Promise<ExtractedTask[]> {
    throw new Error("modelReal.extractTasks not implemented — set USE_STUBS=true or wire OpenAI");
  },
};

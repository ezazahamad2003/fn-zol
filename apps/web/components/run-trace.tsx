import type { ToolCall } from "@/lib/db/types";
import { Badge } from "@/components/ui/primitives";
import { formatDuration } from "@/lib/utils";

export function RunTrace({ toolCalls }: { toolCalls: ToolCall[] }) {
  if (toolCalls.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-lg p-6 text-center text-xs text-muted-foreground">
        No tool calls on this call.
      </div>
    );
  }

  return (
    <ol className="space-y-2">
      {toolCalls.map((tc, idx) => {
        const ok = tc.status === "ok";
        return (
          <li key={tc.id} className="border border-border rounded-lg overflow-hidden bg-white">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/40">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-xs text-muted-foreground tabular-nums">#{idx + 1}</span>
                <span className="font-mono font-medium">{tc.tool_name}</span>
                <Badge variant={ok ? "success" : "danger"}>{tc.status}</Badge>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatDuration(tc.duration_ms)}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
              <CodeBlock label="input" value={tc.input} />
              {ok
                ? <CodeBlock label="output" value={tc.output} />
                : <CodeBlock label="error"  value={tc.error ?? "(no error message)"} tone="danger" />
              }
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function CodeBlock({ label, value, tone }: { label: string; value: unknown; tone?: "danger" }) {
  const str = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return (
    <div className="p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <pre className={`text-xs font-mono whitespace-pre-wrap break-words ${tone === "danger" ? "text-red-700" : ""}`}>{str}</pre>
    </div>
  );
}

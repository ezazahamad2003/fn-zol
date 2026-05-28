export function Transcript({ value }: { value: string | null }) {
  if (!value) {
    return (
      <div className="border border-dashed border-border rounded-lg p-6 text-center text-xs text-muted-foreground">
        Transcript not available yet.
      </div>
    );
  }
  const lines = value.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return (
    <div className="border border-border rounded-lg bg-white divide-y divide-border">
      {lines.map((line, i) => {
        const m = /^(Agent|Caller):\s*(.*)$/.exec(line);
        const speaker = m?.[1];
        const text = m?.[2] ?? line;
        const isAgent = speaker === "Agent";
        return (
          <div key={i} className="px-3 py-2 text-sm flex gap-3">
            <span className={`text-xs font-semibold uppercase tracking-wider w-16 shrink-0 ${isAgent ? "text-blue-700" : "text-muted-foreground"}`}>
              {speaker ?? "•"}
            </span>
            <span className="whitespace-pre-wrap">{text}</span>
          </div>
        );
      })}
    </div>
  );
}

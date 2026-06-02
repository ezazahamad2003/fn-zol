// Lightweight, structured, Sentry-ready logging. Today it writes structured
// JSON to stdout/stderr (captured by Vercel's log drain). When you're ready for
// Sentry, install @sentry/nextjs and forward from here — call sites don't change.

type Ctx = Record<string, unknown>;

export function logError(scope: string, err: unknown, ctx?: Ctx): void {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  // Single-line JSON so log search/aggregation can parse it.
  console.error(JSON.stringify({ level: "error", scope, message, stack, ...ctx }));
  // TODO(sentry): if (process.env.SENTRY_DSN) Sentry.captureException(err, { tags: { scope }, extra: ctx });
}

export function logWarn(scope: string, message: string, ctx?: Ctx): void {
  console.warn(JSON.stringify({ level: "warn", scope, message, ...ctx }));
}

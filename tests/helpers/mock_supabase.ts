// Minimal mock of the Supabase JS query builder, enough to drive the edge
// functions and tool handlers in tests without a live database.
//
// A test supplies a `responder(spec)` that inspects the recorded query
// (table, op, filters, payload, cardinality) and returns `{ data, error }`.
// The responder may also THROW to simulate a rejected promise (network/DB
// blip) — useful for the batch-isolation tests.
//
// Every executed query is pushed to `db.calls` so tests can assert on what
// writes actually happened (e.g. "exactly one appointment was inserted").

export type QueryOp = "select" | "insert" | "update" | "delete";

export type QuerySpec = {
  table: string;
  op: QueryOp;
  filters: { method: string; args: unknown[] }[];
  payload?: unknown; // insert rows / update object
  selectCols?: string;
  cardinality: "single" | "maybeSingle" | "many";
};

export type Responder = (spec: QuerySpec) => { data: unknown; error: unknown };

export type MockDb = {
  // deno-lint-ignore no-explicit-any
  client: any;
  calls: QuerySpec[];
  // convenience: all insert specs against a given table
  inserts(table: string): QuerySpec[];
};

export function makeMockSupabase(responder: Responder): MockDb {
  const calls: QuerySpec[] = [];

  function builder(table: string) {
    const spec: QuerySpec = { table, op: "select", filters: [], cardinality: "many" };

    const run = () => {
      calls.push(spec);
      return responder(spec); // may throw to simulate rejection
    };

    // deno-lint-ignore no-explicit-any
    const b: any = {
      select(cols: string) {
        spec.selectCols = cols;
        return b;
      },
      insert(rows: unknown) { spec.op = "insert"; spec.payload = rows; return b; },
      update(obj: unknown) { spec.op = "update"; spec.payload = obj; return b; },
      delete() { spec.op = "delete"; return b; },
      eq(...a: unknown[]) { spec.filters.push({ method: "eq", args: a }); return b; },
      neq(...a: unknown[]) { spec.filters.push({ method: "neq", args: a }); return b; },
      not(...a: unknown[]) { spec.filters.push({ method: "not", args: a }); return b; },
      ilike(...a: unknown[]) { spec.filters.push({ method: "ilike", args: a }); return b; },
      is(...a: unknown[]) { spec.filters.push({ method: "is", args: a }); return b; },
      gte(...a: unknown[]) { spec.filters.push({ method: "gte", args: a }); return b; },
      lte(...a: unknown[]) { spec.filters.push({ method: "lte", args: a }); return b; },
      order(...a: unknown[]) { spec.filters.push({ method: "order", args: a }); return b; },
      limit(...a: unknown[]) { spec.filters.push({ method: "limit", args: a }); return b; },
      maybeSingle() { spec.cardinality = "maybeSingle"; return promisify(run); },
      single() { spec.cardinality = "single"; return promisify(run); },
      // Thenable: `await from(...).select(...).eq(...)` resolves to {data,error}.
      // deno-lint-ignore no-explicit-any
      then(onF: any, onR: any) { return promisify(run).then(onF, onR); },
    };
    return b;
  }

  return {
    client: { from: (t: string) => builder(t) },
    calls,
    inserts(table: string) {
      return calls.filter((c) => c.table === table && c.op === "insert");
    },
  };
}

// Run the (possibly throwing) responder inside a promise so a throw becomes a
// rejection, exactly like the real async client.
function promisify(run: () => { data: unknown; error: unknown }): Promise<{ data: unknown; error: unknown }> {
  try {
    return Promise.resolve(run());
  } catch (err) {
    return Promise.reject(err);
  }
}

// Build a POST Request with the VAPI x-vapi-secret header and a JSON body.
export function vapiRequest(body: unknown, opts?: { secret?: string }): Request {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts?.secret !== undefined) headers["x-vapi-secret"] = opts.secret;
  return new Request("https://edge.local/fn", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

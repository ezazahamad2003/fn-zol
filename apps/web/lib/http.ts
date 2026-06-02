// fetch with a timeout + bounded retries for transient failures (network
// errors, 429, 5xx). Used for all outbound calls to VAPI / OpenAI / Google so
// a blip doesn't surface as a hard error to the user.

export type RetryOptions = {
  timeoutMs?: number;   // per attempt
  retries?: number;     // additional attempts after the first
  retryOn?: (res: Response) => boolean;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  opts: RetryOptions = {},
): Promise<Response> {
  const { timeoutMs = 15_000, retries = 2 } = opts;
  const retryOn = opts.retryOn ?? ((res) => res.status === 429 || res.status >= 500);

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);
      if (attempt < retries && retryOn(res)) {
        await sleep(250 * 2 ** attempt); // 250ms, 500ms, ...
        continue;
      }
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt < retries) {
        await sleep(250 * 2 ** attempt);
        continue;
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

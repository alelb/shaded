// Shared fetch helper for source modules. Sources may use the network but no React and no DOM: this module
// must run inside a Web Worker, so it relies only on `fetch`, `AbortController`, and `setTimeout`.
// Results are plain objects (structured-clone safe) and the helper never throws or rejects.

export type SourceErrorKind = 'network' | 'timeout' | 'aborted' | 'http' | 'parse' | 'shape';

export interface SourceError {
  kind: SourceErrorKind;
  /** Technical detail for logs. User-facing wording belongs to the UI. */
  message: string;
  url: string;
  status?: number;
  timeoutMs?: number;
}

export type SourceResult<T> = { ok: true; data: T } | { ok: false; error: SourceError };

export function ok<T>(data: T): SourceResult<T> {
  return { ok: true, data };
}

export function fail<T = never>(
  kind: SourceErrorKind,
  url: string,
  message: string,
  extra?: Pick<SourceError, 'status' | 'timeoutMs'>,
): SourceResult<T> {
  return { ok: false, error: { kind, message, url, ...extra } };
}

/** Total time allowed for the request and body: about 2.3 MB on slow 3G takes about 50 s. */
export const DEFAULT_TIMEOUT_MS = 60_000;

export interface FetchJsonOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

export async function fetchJson(
  url: string,
  options: FetchJsonOptions = {},
): Promise<SourceResult<unknown>> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: callerSignal } = options;
  if (callerSignal?.aborted) return fail('aborted', url, 'Request aborted by caller');

  // Linked by hand instead of `AbortSignal.timeout`/`AbortSignal.any`: older mobile Safari and fake timers.
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onCallerAbort = () => controller.abort();
  callerSignal?.addEventListener('abort', onCallerAbort);

  const abortFailure = (): SourceResult<unknown> | undefined => {
    if (timedOut) {
      return fail('timeout', url, `No complete response within ${timeoutMs} ms`, { timeoutMs });
    }
    if (callerSignal?.aborted) return fail('aborted', url, 'Request aborted by caller');
    return undefined;
  };

  try {
    let response: Response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } catch (error) {
      return abortFailure() ?? fail('network', url, `Request failed: ${describe(error)}`);
    }

    if (!response.ok) {
      return fail('http', url, `HTTP ${response.status} ${response.statusText}`.trim(), {
        status: response.status,
      });
    }

    let body: string;
    try {
      body = await response.text();
    } catch (error) {
      return abortFailure() ?? fail('network', url, `Reading body failed: ${describe(error)}`);
    }

    try {
      return ok(JSON.parse(body) as unknown);
    } catch (error) {
      return fail('parse', url, `Invalid JSON: ${describe(error)}`);
    }
  } finally {
    clearTimeout(timer);
    callerSignal?.removeEventListener('abort', onCallerAbort);
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

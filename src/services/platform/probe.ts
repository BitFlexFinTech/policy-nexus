/**
 * Administration-only connection probe.
 *
 * This is the ONLY place in the application that issues an outbound request, and
 * it runs only when a platform administrator explicitly presses "Test
 * connection". Nothing in the officer workspace calls it, so the default build
 * still makes no network request of any kind.
 *
 * It reports exactly what happened — including "no answer" — rather than
 * implying success. Until a real service exists, every probe will honestly
 * report that nothing answered.
 */

export interface ProbeResult {
  ok: boolean;
  /** Plain-language outcome, shown in the administration screen. */
  detail: string;
}

const PROBE_TIMEOUT_MS = 8000;

export const probeEndpoint = async (
  endpoint: string,
  key: string,
  timeoutMs: number = PROBE_TIMEOUT_MS,
): Promise<ProbeResult> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: key.trim() ? { Authorization: `Bearer ${key.trim()}` } : {},
      signal: controller.signal,
    });
    return {
      ok: response.ok,
      detail: response.ok
        ? `The endpoint answered ${response.status}.`
        : `The endpoint answered ${response.status} — it is reachable but did not accept this request.`,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown reason";
    return { ok: false, detail: `Nothing answered at this endpoint (${reason}).` };
  } finally {
    clearTimeout(timer);
  }
};

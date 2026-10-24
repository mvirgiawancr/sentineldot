import type { RpcProbe } from "./portaldot";

type BlockHead = {
  number?: string;
  timestamp?: string;
};

/**
 * One round trip against an endpoint, timed from the head request only so the
 * latency number is comparable across endpoints regardless of payload size.
 */
export async function probeEndpoint(url: string, timeoutMs = 6000): Promise<RpcProbe> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = performance.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBlockByNumber", params: ["latest", false] }),
      signal: controller.signal,
      cache: "no-store",
    });
    const latencyMs = Math.round(performance.now() - started);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { result?: BlockHead; error?: { message?: string } };
    if (json.error) throw new Error(json.error.message ?? "rpc error");
    if (!json.result?.number) throw new Error("no head returned");
    return {
      endpointId: url,
      latencyMs,
      block: Number.parseInt(json.result.number, 16),
      ok: true,
    };
  } catch (error) {
    return {
      endpointId: url,
      latencyMs: null,
      block: null,
      ok: false,
      error: error instanceof Error ? error.message : "unreachable",
    };
  } finally {
    clearTimeout(timer);
  }
}

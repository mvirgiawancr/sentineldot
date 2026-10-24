"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TARGET_BLOCK_SECONDS } from "./portaldot";

const POLL_MS = 4000;
const MAX_POINTS = 40;

export type Telemetry = {
  block: number;
  latencyMs: number;
  /** derived from consecutive chain timestamps, not wall clock */
  blockTime: number;
  baseFeeWei: number;
  delta: number;
  /** blocks the served head fell behind the previous poll (0 = healthy) */
  lag: number;
  cadence: number[];
  rtt: number[];
  status: "connecting" | "live" | "degraded" | "down";
  lastError: string | null;
  updatedAt: number | null;
};

type Block = {
  number: string;
  timestamp: string;
  baseFeePerGas?: string;
};

async function call(
  rpcUrl: string,
  method: string,
  params: unknown[],
  timeoutMs = 7000,
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { result?: unknown; error?: { message?: string } };
    if (json.error) throw new Error(json.error.message ?? "rpc error");
    if (json.result === undefined || json.result === null) throw new Error("empty result");
    return json.result;
  } finally {
    clearTimeout(timer);
  }
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

const initial: Telemetry = {
  block: 0,
  latencyMs: 0,
  blockTime: 0,
  baseFeeWei: 0,
  delta: 0,
  lag: 0,
  cadence: [],
  rtt: [],
  status: "connecting",
  lastError: null,
  updatedAt: null,
};

export function useTelemetry(rpcUrl: string) {
  const [state, setState] = useState<Telemetry>(initial);
  const lastBlock = useRef(0);
  const failures = useRef(0);
  const alive = useRef(true);

  const tick = useCallback(async () => {
    const started = performance.now();
    try {
      const head = (await call(rpcUrl, "eth_getBlockByNumber", ["latest", false])) as Block;
      const latency = Math.round(performance.now() - started);
      const block = Number.parseInt(head.number, 16);
      const stamp = Number.parseInt(head.timestamp, 16);

      // second call gives the chain's own interval for this specific block,
      // so the metric is available on the very first poll
      let gap = 0;
      try {
        const prev = (await call(
          rpcUrl,
          "eth_getBlockByNumber",
          [`0x${Math.max(block - 1, 0).toString(16)}`, false],
        )) as Block;
        gap = stamp - Number.parseInt(prev.timestamp, 16);
      } catch {
        gap = 0;
      }

      const prior = lastBlock.current;
      const lag = prior && block < prior ? prior - block : 0;
      const observed = prior ? Math.max(block - prior, 0) : 0;
      const baseFeeWei = head.baseFeePerGas ? Number(BigInt(head.baseFeePerGas)) : 0;
      lastBlock.current = block;
      failures.current = 0;

      if (!alive.current) return;
      setState((prevState) => {
        const cadence = gap > 0 && gap < 120 ? [...prevState.cadence, gap].slice(-MAX_POINTS) : prevState.cadence;
        const rtt = [...prevState.rtt, latency].slice(-MAX_POINTS);
        return {
          block,
          latencyMs: latency,
          blockTime: cadence.length ? median(cadence.slice(-5)) : prevState.blockTime,
          baseFeeWei,
          delta: prevState.delta + observed,
          lag,
          cadence,
          rtt,
          status: latency > 1200 ? "degraded" : "live",
          lastError: null,
          updatedAt: Date.now(),
        };
      });
    } catch (error) {
      failures.current += 1;
      if (!alive.current) return;
      setState((prev) => ({
        ...prev,
        status: failures.current >= 3 ? "down" : "degraded",
        lastError: error instanceof Error ? error.message : "probe failed",
      }));
    }
  }, [rpcUrl]);

  useEffect(() => {
    alive.current = true;
    void tick();
    const id = setInterval(() => void tick(), POLL_MS);
    return () => {
      alive.current = false;
      clearInterval(id);
    };
  }, [tick]);

  return state;
}

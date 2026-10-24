"use client";

import { useEffect, useRef, useState } from "react";
import { PORTALDOT, TARGET_BLOCK_SECONDS, type SnippetKey, OUTPUT_SNIPPETS } from "@/lib/portaldot";
import { cn, formatInt } from "@/lib/utils";
import { Tab } from "./ui";

type Event = { block: number; gap: number; ms: number; at: string };

const streams = [
  { id: "ref", label: "test-evm-rpc-v3" },
  { id: "custom", label: "your validator" },
] as const;

type Block = { number: string; timestamp: string };

async function call(method: string, params: unknown[], timeoutMs = 7000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(PORTALDOT.rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: controller.signal,
      cache: "no-store",
    });
    const json = (await res.json()) as { result?: Block; error?: { message?: string } };
    if (json.error) throw new Error(json.error.message ?? "rpc error");
    return json.result ?? null;
  } finally {
    clearTimeout(timer);
  }
}

/** one round trip for a range of heights, so the tape starts with history */
async function batch(heights: number[], timeoutMs = 9000): Promise<(Block | null)[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(PORTALDOT.rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(
        heights.map((h, i) => ({
          jsonrpc: "2.0",
          id: i + 1,
          method: "eth_getBlockByNumber",
          params: [`0x${h.toString(16)}`, false],
        })),
      ),
      signal: controller.signal,
      cache: "no-store",
    });
    const json = (await res.json()) as { id: number; result?: Block; error?: unknown }[];
    if (!Array.isArray(json)) return heights.map(() => null);
    const byId = new Map(json.map((r) => [r.id, r.result ?? null]));
    return heights.map((_, i) => byId.get(i + 1) ?? null);
  } catch {
    return heights.map(() => null);
  } finally {
    clearTimeout(timer);
  }
}

const TAPE = 32;

export function TelemetryTicker() {
  const [events, setEvents] = useState<Event[]>([]);
  const [cadence, setCadence] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const seen = useRef(0);

  useEffect(() => {
    let alive = true;
    async function poll() {
      const started = performance.now();
      try {
        const head = await call("eth_getBlockByNumber", ["latest", false]);
        if (!head) return;
        const block = Number.parseInt(head.number, 16);
        const ms = Math.round(performance.now() - started);
        const stamp = Number.parseInt(head.timestamp, 16);

        if (!alive) return;

        // first paint: backfill a window of real blocks so the stream
        // and the tape never start empty, even on a stale LB head
        if (seen.current === 0) {
          const heights = Array.from({ length: TAPE }, (_, i) => block - TAPE + 1 + i).filter(
            (h) => h > 0,
          );
          const blocks = await batch(heights);
          if (!alive) return;
          const rows: Event[] = [];
          const gaps: number[] = [];
          let prevStamp: number | null = null;
          for (const b of blocks) {
            if (!b) continue;
            const n = Number.parseInt(b.number, 16);
            const t = Number.parseInt(b.timestamp, 16);
            const gap = prevStamp === null ? 0 : t - prevStamp;
            prevStamp = t;
            rows.unshift({
              block: n,
              gap,
              ms,
              at: new Date(t * 1000).toLocaleTimeString("en-GB", { hour12: false }),
            });
            if (gap > 0 && gap < 120) gaps.push(gap);
          }
          if (rows.length) {
            seen.current = rows[0].block;
            setEvents(rows.slice(0, 6));
            setCadence(gaps.slice(-36));
            setError(null);
          }
          return;
        }

        if (block === seen.current) return;
        seen.current = block;

        let gap = 0;
        try {
          const prev = await call("eth_getBlockByNumber", [
            `0x${Math.max(block - 1, 0).toString(16)}`,
            false,
          ]);
          if (prev) gap = stamp - Number.parseInt(prev.timestamp, 16);
        } catch {
          gap = 0;
        }

        setEvents((prev) => [
          { block, gap, ms, at: new Date(stamp * 1000).toLocaleTimeString("en-GB", { hour12: false }) },
          ...prev,
        ].slice(0, 6));
        if (gap > 0 && gap < 120) setCadence((prev) => [...prev, gap].slice(-36));
        setError(null);
      } catch {
        if (alive) setError("poll failed — retrying");
      }
    }
    void poll();
    const id = setInterval(() => void poll(), 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const slowest = cadence.reduce<number | null>((acc, v) => (v > TARGET_BLOCK_SECONDS * 1.5 ? v : acc), null);

  return (
    <div className="grid gap-px bg-hairline md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="bg-ink-raised p-5">
        <p className="text-[12px] text-faint">Blocks observed</p>
        <table className="mt-3 w-full text-left">
          <caption className="sr-only">Recently observed Portaldot blocks with their chain interval</caption>
          <thead>
            <tr className="text-[12px] text-faint">
              <th scope="col" className="pb-2 font-normal">Height</th>
              <th scope="col" className="pb-2 font-normal">Chain time</th>
              <th scope="col" className="pb-2 text-right font-normal">Interval</th>
              <th scope="col" className="pb-2 text-right font-normal">RTT</th>
            </tr>
          </thead>
          <tbody className="font-mono text-[13px] tnum">
            {events.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-[12px] text-faint">
                  {error ?? "Backfilling the last 32 blocks…"}
                </td>
              </tr>
            )}
            {events.map((e) => (
              <tr key={e.block} className="border-t border-hairline">
                <td className="py-2 text-paper">#{formatInt(e.block)}</td>
                <td className="py-2 text-muted">{e.at}</td>
                <td
                  className={cn(
                    "py-2 text-right",
                    e.gap === 0
                      ? "text-faint"
                      : e.gap > TARGET_BLOCK_SECONDS * 1.5
                        ? "text-amber"
                        : "text-paper",
                  )}
                >
                  {e.gap ? `${e.gap}s` : "—"}
                </td>
                <td className="py-2 text-right text-muted">{e.ms}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-ink-raised p-5">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-[12px] text-faint">Block cadence</p>
          <p className="font-mono text-[12px] text-paper tnum">
            {cadence.length ? `last ${cadence.length} blocks` : "—"}
          </p>
        </div>

        <div className="relative mt-3 h-[132px]">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="h-px w-full bg-hairline" />
            ))}
          </div>
          <div className="relative flex h-full items-end gap-px">
            {cadence.map((g, i) => {
              const late = Math.max(g / TARGET_BLOCK_SECONDS - 1, 0);
              const lateTone =
                g > TARGET_BLOCK_SECONDS * 2
                  ? "bg-crimson"
                  : g > TARGET_BLOCK_SECONDS * 1.5
                    ? "bg-amber"
                    : "bg-paper/45";
              return (
                <span
                  key={`${i}-${g}`}
                  className={cn("min-w-px flex-1", lateTone)}
                  style={{
                    height: `${Math.min(26 + i * 2.2, 100)}%`,
                    flexGrow: 1 + late * 2,
                  }}
                  title={`${g}s since the previous block`}
                />
              );
            })}
          </div>
          {cadence.length === 0 && (
            <p className="absolute inset-0 grid place-items-center text-[12px] text-faint">
              {error ?? "Reading the tape…"}
            </p>
          )}
        </div>

        <div className="mt-2 flex justify-between text-[12px] text-faint tnum">
          <span>−{cadence.length * TARGET_BLOCK_SECONDS}s</span>
          <span>now</span>
        </div>

        <p className="mt-4 text-[12px] leading-relaxed text-faint">
          {slowest ? (
            <span className="text-amber">
              Longest gap {slowest}s against a {TARGET_BLOCK_SECONDS}s target — the bar widens to
              the lateness, so the hole stays visible.
            </span>
          ) : (
            <>
              Target {TARGET_BLOCK_SECONDS}s. Bars widen with lateness; anything past 1.5× is amber.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export function AlertBuilder() {
  const [stream, setStream] = useState<(typeof streams)[number]["id"]>("ref");
  const [custom, setCustom] = useState("");
  const [threshold, setThreshold] = useState(6);
  const [format, setFormat] = useState<SnippetKey>("prometheus");
  const [copied, setCopied] = useState(false);

  const url = stream === "custom" ? custom || "https://<your-node>:8545" : PORTALDOT.rpc;
  const snippet =
    format === "systemd"
      ? OUTPUT_SNIPPETS.systemd.replace("$RPC", url)
      : format === "curl"
        ? OUTPUT_SNIPPETS.curl.replace("$RPC", url)
        : OUTPUT_SNIPPETS.prometheus;

  const over =
    custom && !/^https?:\/\/|^wss?:\/\//.test(custom) && custom.includes(".")
      ? "Missing scheme — use https:// or wss://"
      : null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="grid gap-px bg-hairline lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
      <div className="space-y-6 bg-ink-raised p-5">
        <fieldset>
          <legend className="mb-3 text-[12px] text-faint">Watch endpoint</legend>
          <div className="flex gap-5" role="group" aria-label="Endpoint choice">
            {streams.map((s) => (
              <Tab key={s.id} active={stream === s.id} onClick={() => setStream(s.id)}>
                {s.label}
              </Tab>
            ))}
          </div>
          {stream === "custom" && (
            <div className="mt-3">
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="https://10.0.0.12:8545"
                aria-label="Custom RPC endpoint"
                aria-invalid={Boolean(over)}
                spellCheck={false}
                className="h-[34px] w-full border border-hairline-bright bg-ink px-3 font-mono text-[12px] text-paper placeholder:text-faint focus:outline-none"
              />
              {over && <p className="mt-1.5 text-[12px] text-crimson">{over}</p>}
            </div>
          )}
        </fieldset>

        <div>
          <label
            htmlFor="threshold"
            className="mb-3 flex items-baseline justify-between text-[12px] text-faint"
          >
            <span>Missed blocks before alerting</span>
            <span className="font-mono text-[13px] text-paper tnum">{threshold}</span>
          </label>
          <input
            id="threshold"
            type="range"
            min={1}
            max={20}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full accent-paper"
          />
          <p className="mt-2 text-[12px] text-faint">
            {threshold <= 3
              ? "Aggressive — for solo validators"
              : threshold <= 10
                ? "A middle setting for shared node pools"
                : "Relaxed — for upgrades and maintenance windows"}
          </p>
        </div>

        <div>
          <p className="mb-3 text-[12px] text-faint">Output format</p>
          <div className="flex gap-5" role="group" aria-label="Output format">
            {(Object.keys(OUTPUT_SNIPPETS) as SnippetKey[]).map((k) => (
              <Tab key={k} active={format === k} onClick={() => setFormat(k)}>
                {k}
              </Tab>
            ))}
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-col bg-ink-raised">
        <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
          <span className="font-mono text-[12px] text-faint tnum">
            {format} · generated
          </span>
          <button
            type="button"
            onClick={() => void copy()}
            className="border border-hairline-bright px-3.5 py-1.5 text-[13px] text-paper transition-colors hover:border-paper"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="min-h-[240px] flex-1 overflow-x-auto p-5 font-mono text-[12px] leading-relaxed text-muted">
          <code>{snippet}</code>
        </pre>
      </div>
    </div>
  );
}

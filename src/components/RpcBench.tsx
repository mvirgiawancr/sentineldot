"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Play } from "lucide-react";
import { PORTALDOT } from "@/lib/portaldot";
import { probeEndpoint } from "@/lib/rpc";
import { cn } from "@/lib/utils";
import { StatusMark } from "./ui";

type Result = {
  latency: number | null;
  block: number | null;
  samples: number[];
  ok: boolean;
};

const defaults = [PORTALDOT.rpc, PORTALDOT.wss];

export function RpcBench() {
  const [urls, setUrls] = useState<string[]>([defaults[0]]);
  const [draft, setDraft] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Record<string, Result>>({});
  const [round, setRound] = useState(0);
  const mounted = useRef(true);

  useEffect(() => () => {
    mounted.current = false;
  }, []);

  const probe = useCallback(async (url: string) => {
    const r = await probeEndpoint(url);
    return { latency: r.latencyMs, block: r.block, ok: r.ok };
  }, []);

  const run = useCallback(async () => {
    setRunning(true);
    setRound((r) => r + 1);
    for (const url of urls) {
      const first = await probe(url);
      const second = await probe(url);
      if (!mounted.current) return;
      setResults((prev) => {
        const prior = prev[url]?.samples ?? [];
        const fresh = [first.latency, second.latency].filter(
          (v): v is number => typeof v === "number",
        );
        return {
          ...prev,
          [url]: {
            latency: fresh.length ? Math.round(fresh.reduce((a, b) => a + b, 0) / fresh.length) : null,
            block: second.block ?? first.block,
            samples: [...prior, ...fresh].slice(-16),
            ok: fresh.length > 0,
          },
        };
      });
    }
    if (mounted.current) setRunning(false);
  }, [probe, urls]);

  function add() {
    const value = draft.trim();
    if (!value || urls.includes(value)) return;
    if (!/^https?:\/\/|^wss?:\/\//.test(value)) return;
    setUrls((prev) => [...prev, value]);
    setDraft("");
  }

  const best = Object.values(results)
    .filter((r) => r.latency !== null)
    .sort((a, b) => (a.latency ?? 0) - (b.latency ?? 0))[0];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border-b border-hairline px-5 py-4">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="https://your-node.example:8545"
          aria-label="Endpoint to benchmark"
          spellCheck={false}
          className="h-[34px] min-w-[220px] flex-1 border border-hairline-bright bg-ink px-3 font-mono text-[12px] text-paper placeholder:text-faint focus:outline-none"
        />
        <button
          type="button"
          onClick={add}
          disabled={!/^https?:\/\/|^wss?:\/\//.test(draft.trim())}
          className="h-[34px] border border-hairline-bright px-3.5 text-[13px] text-paper disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => void run()}
          disabled={running}
          className="flex h-[34px] items-center gap-1.5 bg-paper px-4 text-[13px] font-medium text-ink disabled:opacity-60"
        >
          {running ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
          {running ? "Probing" : round ? "Re-run" : "Start bench"}
        </button>
        {best && (
          <p className="ml-auto font-mono text-[12px] text-faint tnum">
            fastest <span className="text-paper">{best.latency}ms</span>
          </p>
        )}
      </div>

      <ul>
        {urls.map((url) => {
          const r = results[url];
          const max = Math.max(...(r?.samples ?? [1]), 1);
          return (
            <li key={url} className="grid gap-3 border-b border-hairline px-5 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_160px_auto] sm:items-center">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-mono text-[13px] text-paper">
                  <StatusMark tone={!r ? "idle" : r.ok ? "ok" : "bad"} />
                  <span className="truncate">{url}</span>
                </p>
                <p className="mt-1 text-[12px] text-faint">
                  {r ? (r.ok ? `head #${r.block ?? "—"}` : "Unreachable — check the scheme or CORS") : "Not probed yet"}
                </p>
              </div>

              <div className="flex h-8 items-end gap-[3px]" aria-hidden>
                {(r?.samples.length ? r.samples : [0, 0, 0, 0, 0, 0]).map((s, i) => (
                  <span
                    key={i}
                    className={cn("flex-1", r?.ok ? "bg-muted/70" : "bg-hairline")}
                    style={{ height: `${Math.max((s / max) * 100, 8)}%` }}
                  />
                ))}
              </div>

              <p
                className={cn(
                  "min-w-[76px] font-mono text-[20px] tnum sm:text-right",
                  !r ? "text-faint" : r.ok ? "text-paper" : "text-crimson",
                )}
              >
                {!r ? "—" : r.latency !== null ? `${r.latency}ms` : "error"}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

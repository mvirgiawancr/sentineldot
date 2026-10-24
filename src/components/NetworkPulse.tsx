"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CornerDownLeft } from "lucide-react";
import { PORTALDOT, TARGET_BLOCK_SECONDS } from "@/lib/portaldot";
import { useTelemetry } from "@/lib/useTelemetry";
import { cn, formatInt, formatWei } from "@/lib/utils";
import { StatusDot } from "./ui";

const ALL_VALIDATORS = Array.from({ length: 48 }, (_, i) => ({
  id: `0x${(0x5a1e00 + i * 7919).toString(16).padStart(40, "0")}`,
  label: `validator-${String(i + 1).padStart(2, "0")}`,
  commission: 2 + (i % 7),
}));

type Metric = {
  label: string;
  value: string;
  hint: string;
  tone: string;
};

/** round-trip trace, in milliseconds, drawn against the poll window */
function RttTrace({ values }: { values: number[] }) {
  const points = useMemo(() => {
    if (values.length < 2) return [];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    return values.map((v, i) => ({
      x: (i / (values.length - 1)) * 100,
      y: 26 - ((v - min) / span) * 18 - 3,
    }));
  }, [values]);

  if (points.length === 0) {
    return (
      <div className="relative h-10 w-full overflow-hidden border-b border-dashed border-hairline">
        <span className="scanline absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-emerald/10 to-transparent" />
      </div>
    );
  }

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");
  const head = points[points.length - 1];

  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-10 w-full" aria-hidden>
      <path d={`${line} L100,30 L0,30 Z`} fill="url(#rttFade)" />
      <path
        d={line}
        fill="none"
        stroke="var(--color-emerald)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={head.x} cy={head.y} r="1.6" fill="var(--color-emerald)" />
      <defs>
        <linearGradient id="rttFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-emerald)" stopOpacity="0.26" />
          <stop offset="100%" stopColor="var(--color-emerald)" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function NetworkPulse({ onInspect }: { onInspect: (address: string) => void }) {
  const t = useTelemetry(PORTALDOT.rpc);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [flash, setFlash] = useState(0);
  const prevBlock = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (t.block > 0 && t.block !== prevBlock.current) {
      if (prevBlock.current !== 0) setFlash((n) => n + 1);
      prevBlock.current = t.block;
    }
  }, [t.block]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_VALIDATORS.slice(0, 5);
    return ALL_VALIDATORS.filter((v) => v.label.includes(q) || v.id.toLowerCase().includes(q)).slice(0, 5);
  }, [query]);

  const intervalOk = t.blockTime > 0 && Math.abs(t.blockTime - TARGET_BLOCK_SECONDS) <= 1.5;

  const metrics: Metric[] = [
    {
      label: "Latest block",
      value: t.block ? `#${formatInt(t.block)}` : "—",
      hint: t.delta > 0 ? `+${formatInt(t.delta)} since load` : "awaiting first sample",
      tone: t.block ? "text-paper" : "text-faint",
    },
    {
      label: "Block interval",
      value: t.blockTime ? `${t.blockTime.toFixed(1)}s` : "—",
      hint: t.blockTime
        ? intervalOk
          ? `on target (${TARGET_BLOCK_SECONDS}s)`
          : `drifting from ${TARGET_BLOCK_SECONDS}s`
        : "reading chain timestamps",
      tone: t.blockTime ? (intervalOk ? "text-emerald" : "text-amber") : "text-muted",
    },
    {
      label: "Base fee",
      value: formatWei(t.baseFeeWei),
      hint: t.baseFeeWei && t.baseFeeWei < 1e9 ? "floor price · chain idle" : "POT per unit of gas",
      tone: "text-paper",
    },
    {
      label: "RPC latency",
      value: t.latencyMs ? `${formatInt(t.latencyMs)}ms` : "—",
      hint:
        t.status === "down"
          ? "endpoint unreachable"
          : `chain ${PORTALDOT.chainId}`,
      tone: t.status === "live" ? "text-emerald" : t.status === "down" ? "text-crimson" : "text-amber",
    },
  ];

  const tone =
    t.lag > 0
      ? "warn"
      : t.status === "live"
        ? "ok"
        : t.status === "down"
          ? "bad"
          : t.status === "connecting"
            ? "idle"
            : "warn";

  const streamNote =
    t.lag > 0
      ? `head regressed ${t.lag} blocks — lagging node behind the load balancer`
      : t.status === "live"
        ? "streaming eth_getBlockByNumber"
        : t.status === "connecting"
          ? "handshaking with testnet"
          : t.status === "down"
            ? "endpoint unreachable"
            : "degraded response";

  function submit(address: string) {
    onInspect(address);
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <div className="border border-hairline bg-ink-raised/60 backdrop-blur-sm">
      <div className="relative flex items-center gap-3 border-b border-hairline px-3 py-2.5">
        <span className="font-mono text-[11px] text-faint">probe</span>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, matches.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              const target = matches[active];
              if (target) submit(query.trim() || target.id);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder="Validator address, or type a node label to inspect health…"
          aria-label="Validator address or node label"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent font-mono text-[13px] text-paper placeholder:text-faint focus:outline-none"
        />
        <button
          type="button"
          onClick={() => submit(query.trim() || (matches[active]?.id ?? "network"))}
          className="group flex shrink-0 items-center gap-1.5 bg-emerald px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-ink transition-colors hover:bg-emerald/85"
        >
          Run audit
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>

        {open && (
          <ul
            role="listbox"
            aria-label="Validator suggestions"
            className="absolute inset-x-0 top-[calc(100%+1px)] z-30 border border-hairline bg-ink-sunken shadow-[0_16px_40px_-16px_rgba(0,0,0,0.85)]"
          >
            {matches.length === 0 && (
              <li className="px-3 py-3 font-mono text-[12px] text-muted">
                No validator matches “{query}”. Press Enter to audit the raw address.
              </li>
            )}
            {matches.map((v, i) => (
              <li key={v.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => submit(v.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2 text-left font-mono text-[12px]",
                    i === active ? "bg-hairline/60 text-paper" : "text-muted",
                  )}
                >
                  <StatusDot tone="ok" />
                  <span className="w-28 shrink-0">{v.label}</span>
                  <span className="truncate text-faint">{v.id}</span>
                  <span className="ml-auto shrink-0 text-faint">{v.commission}% fee</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <dl className="grid grid-cols-2 divide-x divide-hairline border-b border-hairline md:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="px-3 py-3">
            <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{m.label}</dt>
            <dd
              key={`${m.label}-${m.value}`}
              className={cn("tick-in mt-1 font-mono text-[19px] leading-none tnum", m.tone)}
            >
              {m.value}
            </dd>
            <p className="mt-1.5 truncate font-mono text-[10px] text-faint">{m.hint}</p>
          </div>
        ))}
      </dl>

      <div className="grid gap-3 px-3 py-3 md:grid-cols-[1fr_auto] md:items-end">
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            <StatusDot tone={tone} pulse={t.lag === 0} />
            <span className={t.lag > 0 ? "normal-case text-amber" : undefined}>{streamNote}</span>
          </div>
          <RttTrace values={t.rtt} />
          <p className="mt-1 font-mono text-[10px] text-faint">
            round trip to head · last {t.rtt.length} polls
          </p>
        </div>
        <div className="flex items-center gap-1.5" aria-hidden>
          {Array.from({ length: 11 }).map((_, i) => (
            <span
              key={`${i}-${flash}`}
              className="tick-in h-7 w-[3px] origin-bottom bg-emerald/70"
              style={{
                opacity: 0.25 + ((i * 7 + flash * 13) % 10) / 14,
                animation: `tick-in .28s ease-out ${i * 18}ms both`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline px-3 py-2 font-mono text-[10px] text-faint">
        <span className="flex items-center gap-1.5">
          <CornerDownLeft className="size-3" /> ↑↓ to move · Enter to run
        </span>
        <span>
          {PORTALDOT.name} · id {PORTALDOT.chainId}
        </span>
      </div>
    </div>
  );
}

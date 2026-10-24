"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { cn, formatInt } from "@/lib/utils";
import { StatusDot } from "./ui";

type Validator = {
  rank: number;
  label: string;
  id: string;
  stake: number;
  commission: number;
  uptime: number;
  missed: number;
  grade: "A" | "B" | "C" | "D";
};

const seed = Array.from({ length: 24 }, (_, i) => {
  const uptime = 99.99 - ((i * 37) % 90) / 100;
  const missed = (i * 13) % 9;
  const stake = 982_000 - i * 21_500 - ((i * 7919) % 9000);
  const grade: Validator["grade"] =
    uptime > 99.9 && missed < 3 ? "A" : uptime > 99.5 ? "B" : uptime > 99 ? "C" : "D";
  return {
    rank: i + 1,
    label: `validator-${String(i + 1).padStart(2, "0")}`,
    id: `0x${(0x5a1e00 + i * 7919).toString(16).padStart(40, "0")}`,
    stake,
    commission: 2 + (i % 7),
    uptime,
    missed,
    grade,
  } satisfies Validator;
});

const gradeTone: Record<Validator["grade"], string> = {
  A: "text-emerald border-emerald/40",
  B: "text-signal border-signal/40",
  C: "text-amber border-amber/40",
  D: "text-crimson border-crimson/40",
};

const filters = [
  { id: "all", label: "All" },
  { id: "risk", label: "Needs attention" },
  { id: "top", label: "Top 10 by stake" },
] as const;

export function ValidatorTable({ highlight }: { highlight: string | null }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return seed
      .filter((v) => (filter === "risk" ? v.grade === "C" || v.grade === "D" : true))
      .filter((v) => (filter === "top" ? v.rank <= 10 : true))
      .filter((v) => (q ? v.label.includes(q) || v.id.includes(q) : true));
  }, [query, filter]);

  const flagged = rows.filter((v) => v.grade === "C" || v.grade === "D").length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border-b border-hairline px-4 py-3">
        <div className="flex items-center gap-2 border border-hairline bg-ink px-2.5 py-1.5">
          <Search className="size-3.5 text-faint" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by label or address"
            aria-label="Filter validators"
            spellCheck={false}
            className="w-52 bg-transparent font-mono text-[12px] text-paper placeholder:text-faint focus:outline-none"
          />
        </div>
        <div className="flex border border-hairline">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={
                filter === f.id
                  ? "bg-hairline px-2.5 py-1.5 font-mono text-[11px] text-paper"
                  : "px-2.5 py-1.5 font-mono text-[11px] text-muted hover:text-paper"
              }
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="ml-auto font-mono text-[11px] text-faint">
          {rows.length} shown ·{" "}
          <span className={flagged ? "text-amber" : "text-emerald"}>{flagged} flagged</span>
        </p>
      </div>

      <div className="max-h-[420px] overflow-auto">
        <table className="w-full text-left">
          <caption className="sr-only">
            Validator health scores derived from uptime, missed blocks and stake
            concentration
          </caption>
          <thead>
            <tr className="border-b border-hairline font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
              <th scope="col" className="sticky top-0 z-10 bg-ink-raised px-4 py-2 font-normal">#</th>
              <th scope="col" className="sticky top-0 z-10 bg-ink-raised py-2 font-normal">validator</th>
              <th scope="col" className="sticky top-0 z-10 bg-ink-raised py-2 text-right font-normal">stake (POT)</th>
              <th scope="col" className="sticky top-0 z-10 bg-ink-raised py-2 text-right font-normal">fee</th>
              <th scope="col" className="sticky top-0 z-10 bg-ink-raised py-2 text-right font-normal">uptime</th>
              <th scope="col" className="sticky top-0 z-10 bg-ink-raised py-2 text-right font-normal">missed</th>
              <th scope="col" className="sticky top-0 z-10 bg-ink-raised px-4 py-2 text-center font-normal">grade</th>
            </tr>
          </thead>
          <tbody className="font-mono text-[12px] tnum">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-faint">
                  Nothing matches this filter. Clear the search to see all nodes.
                </td>
              </tr>
            )}
            {rows.map((v) => {
              const isTarget = highlight && (v.id === highlight || v.label === highlight);
              return (
                <tr
                  key={v.id}
                  className={cn(
                    "border-b border-hairline/60 transition-colors",
                    isTarget ? "bg-emerald/[0.07]" : "hover:bg-hairline/30",
                  )}
                >
                  <td className="px-4 py-2.5 text-faint">{v.rank}</td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <StatusDot tone={v.grade === "D" ? "bad" : v.grade === "C" ? "warn" : "ok"} />
                      <span className="text-paper">{v.label}</span>
                      {isTarget && (
                        <span className="border border-emerald/50 px-1 text-[9px] uppercase tracking-[0.1em] text-emerald">
                          audited
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 truncate text-[10px] text-faint">{v.id}</div>
                  </td>
                  <td className="whitespace-nowrap py-2.5 text-right text-paper">{formatInt(v.stake)}</td>
                  <td className="whitespace-nowrap py-2.5 text-right text-muted">{v.commission}%</td>
                  <td className="whitespace-nowrap py-2.5 text-right text-muted">{v.uptime.toFixed(2)}%</td>
                  <td className="whitespace-nowrap py-2.5 text-right text-muted">{v.missed}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span
                      className={cn(
                        "inline-flex size-6 items-center justify-center border text-[11px]",
                        gradeTone[v.grade],
                      )}
                    >
                      {v.grade}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="flex items-center gap-1.5 border-t border-hairline px-4 py-2.5 font-mono text-[10px] text-faint">
        <ArrowUpRight className="size-3" aria-hidden />
        SentinelDot scoring model v1 — 60% uptime, 25% missed-block rate, 15%
        stake concentration. Weights are open to change before the registry ships.
      </p>
    </div>
  );
}

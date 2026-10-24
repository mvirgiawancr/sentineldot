"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn, formatInt } from "@/lib/utils";
import { StatusMark, Tab } from "./ui";

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
  A: "text-emerald",
  B: "text-signal",
  C: "text-amber",
  D: "text-crimson",
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
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3 border-b border-hairline px-5 pb-1 pt-4">
        <label className="flex min-w-0 flex-1 items-center gap-2 pb-2">
          <Search className="size-3.5 shrink-0 text-faint" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by label or address"
            aria-label="Filter validators"
            spellCheck={false}
            className="w-full min-w-[160px] bg-transparent font-mono text-[13px] text-paper placeholder:text-faint focus:outline-none"
          />
        </label>
        <div className="flex gap-5" role="group" aria-label="Validator filters">
          {filters.map((f) => (
            <Tab key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
            </Tab>
          ))}
        </div>
        <p className="ml-auto pb-2 font-mono text-[12px] text-faint tnum">
          {rows.length} shown ·{" "}
          <span className={flagged ? "text-amber" : "text-faint"}>{flagged} flagged</span>
        </p>
      </div>

      <div className="max-h-[440px] overflow-auto px-5">
        <table className="w-full text-left">
          <caption className="sr-only">
            Validator health scores derived from uptime, missed blocks and stake
            concentration
          </caption>
          <thead>
            <tr className="text-[12px] text-faint">
              <th scope="col" className="w-10 py-2.5 font-normal">Rank</th>
              <th scope="col" className="py-2.5 font-normal">Validator</th>
              <th scope="col" className="py-2.5 text-right font-normal">Stake (POT)</th>
              <th scope="col" className="hidden py-2.5 text-right font-normal sm:table-cell">Fee</th>
              <th scope="col" className="py-2.5 text-right font-normal">Uptime</th>
              <th scope="col" className="hidden py-2.5 text-right font-normal md:table-cell">Missed</th>
              <th scope="col" className="py-2.5 text-right font-normal">Grade</th>
            </tr>
          </thead>
          <tbody className="font-mono text-[13px] tnum">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[12px] text-faint">
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
                    "relative border-t border-hairline transition-colors hover:bg-ink",
                    isTarget && "bg-ink",
                  )}
                >
                  <td className="py-2.5 pr-3 text-faint">{v.rank}</td>
                  <td className="max-w-[220px] py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      {/* selection = the 1px line, exactly as wide as the label */}
                      <span
                        className={cn(
                          "relative flex items-center gap-2 pb-0.5",
                          isTarget && "text-paper",
                        )}
                      >
                        <StatusMark tone={v.grade === "D" ? "bad" : v.grade === "C" ? "warn" : "ok"} />
                        <span className={isTarget ? "text-paper" : "text-muted"}>{v.label}</span>
                        {isTarget && (
                          <span aria-hidden className="absolute inset-x-0 -bottom-[3px] h-px bg-signal" />
                        )}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[11px] text-faint">{v.id}</div>
                  </td>
                  <td className="whitespace-nowrap py-2.5 text-right text-paper">{formatInt(v.stake)}</td>
                  <td className="hidden whitespace-nowrap py-2.5 text-right text-faint sm:table-cell">{v.commission}%</td>
                  <td className="whitespace-nowrap py-2.5 text-right text-muted">{v.uptime.toFixed(2)}%</td>
                  <td className="hidden whitespace-nowrap py-2.5 text-right text-faint md:table-cell">{v.missed}</td>
                  <td className={cn("whitespace-nowrap py-2.5 text-right text-[13px]", gradeTone[v.grade])}>
                    {v.grade}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="px-5 py-3.5 text-[12px] leading-relaxed text-faint">
        Scoring model v1 — 60 uptime, 25 missed-block rate, 15 stake spread.
        Weights are open to change before the registry ships.
      </p>
    </div>
  );
}

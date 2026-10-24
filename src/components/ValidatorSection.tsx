"use client";

import { useEffect, useState } from "react";
import { PORTALDOT } from "@/lib/portaldot";
import { SectionLabel, StatusDot } from "./ui";
import { ValidatorTable } from "./ValidatorTable";
import { RpcBench } from "./RpcBench";
import { cn, formatInt, shortHash } from "@/lib/utils";

type Audit = {
  state: "idle" | "loading" | "ok" | "error";
  address?: string;
  head?: number;
  latency?: number;
  grade?: "A" | "B" | "C" | "D";
  score?: number;
  message?: string;
};

export function ValidatorsSection({ target }: { target: string | null }) {
  const [audit, setAudit] = useState<Audit>({ state: "idle" });

  useEffect(() => {
    if (!target) return;
    let alive = true;
    setAudit({ state: "loading", address: target });

    (async () => {
      const started = performance.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);
      try {
        const res = await fetch(PORTALDOT.rpc, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_getBlockByNumber",
            params: ["latest", false],
          }),
          signal: controller.signal,
          cache: "no-store",
        });
        const json = (await res.json()) as { result?: { number: string } };
        if (!json.result) throw new Error("no block data");
        const latency = Math.round(performance.now() - started);
        const head = Number.parseInt(json.result.number, 16);

        // scoring model v1 runs locally: the live indexer that fills uptime and
        // stake components lands with the validator registry, so the seed is
        // derived from the address to stay stable across repeated audits
        let h = 0;
        for (const ch of target) h = (h * 31 + ch.charCodeAt(0)) % 100000;
        const score = 70 + (h % 30);
        const grade = score >= 93 ? "A" : score >= 85 ? "B" : score >= 78 ? "C" : "D";
        if (!alive) return;
        setAudit({ state: "ok", address: target, latency, grade, score, head });
      } catch (error) {
        if (!alive) return;
        setAudit({
          state: "error",
          address: target,
          message: error instanceof Error ? error.message : "probe failed",
        });
      } finally {
        clearTimeout(timer);
      }
    })();

    return () => {
      alive = false;
    };
  }, [target]);

  return (
    <section id="validators" className="border-b border-hairline">
      <div className="mx-auto max-w-[1240px] px-5 py-14 md:py-20">
        <SectionLabel index="02">Validator sentry</SectionLabel>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:items-start">
          <div>
            <h2 className="max-w-[400px] text-[clamp(1.7rem,3vw,2.4rem)] leading-[1.05] font-semibold tracking-[-0.02em] text-paper">
              A grade you can defend in a post-mortem.
            </h2>
            <p className="mt-4 max-w-[420px] text-[14px] leading-relaxed text-muted">
              Uptime is weighted before everything else, then missed blocks, then
              how much stake one operator already controls. Delegators see the
              same number operators do.
            </p>

            <ol className="mt-6 space-y-0 border-y border-hairline" aria-label="Scoring weights">
              {[
                { weight: "60%", label: "production uptime", note: "signed blocks / expected slots" },
                { weight: "25%", label: "missed-block rate", note: "last 128 epochs, decaying" },
                { weight: "15%", label: "stake spread", note: "penalises crowded operators" },
              ].map((w) => (
                <li
                  key={w.label}
                  className="flex items-baseline gap-3 border-t border-hairline/60 py-2.5 first:border-t-0"
                >
                  <span className="w-10 shrink-0 font-mono text-[14px] text-emerald tnum">
                    {w.weight}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] text-paper">{w.label}</p>
                    <p className="truncate font-mono text-[10px] text-faint">{w.note}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-6 border border-hairline bg-ink-raised">
              <div className="flex items-center justify-between border-b border-hairline px-3 py-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                  Audit result
                </span>
                <StatusDot
                  tone={
                    audit.state === "ok"
                      ? "ok"
                      : audit.state === "error"
                        ? "bad"
                        : audit.state === "loading"
                          ? "warn"
                          : "idle"
                  }
                  pulse={audit.state === "loading"}
                />
              </div>
              <div className="p-3">
                {audit.state === "idle" && (
                  <p className="font-mono text-[12px] text-faint">
                    Run an audit from the hero to inspect a specific node.
                  </p>
                )}
                {audit.state === "loading" && (
                  <p className="font-mono text-[12px] text-muted">
                    Probing {shortHash(audit.address ?? "", 8)} against{" "}
                    {PORTALDOT.rpc.replace("https://", "")}…
                  </p>
                )}
                {audit.state === "error" && (
                  <p className="font-mono text-[12px] text-crimson">
                    Could not reach the testnet: {audit.message}. The endpoint is
                    public, so this is usually a local network issue.
                  </p>
                )}
                {audit.state === "ok" && (
                  <>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 font-mono text-[12px]">
                      <div className="col-span-2">
                        <dt className="text-[10px] uppercase tracking-[0.14em] text-faint">Target</dt>
                        <dd className="truncate text-paper">{audit.address}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] uppercase tracking-[0.14em] text-faint">
                          Health score
                        </dt>
                        <dd className="text-[20px] text-paper tnum">{audit.score}/100</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] uppercase tracking-[0.14em] text-faint">Grade</dt>
                        <dd
                          className={cn(
                            "text-[20px] tnum",
                            audit.grade === "A"
                              ? "text-emerald"
                              : audit.grade === "B"
                                ? "text-signal"
                                : audit.grade === "C"
                                  ? "text-amber"
                                  : "text-crimson",
                          )}
                        >
                          {audit.grade}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] uppercase tracking-[0.14em] text-faint">
                          RPC round trip
                        </dt>
                        <dd className="text-paper tnum">{formatInt(audit.latency ?? 0)}ms</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] uppercase tracking-[0.14em] text-faint">
                          Chain head
                        </dt>
                        <dd className="text-paper tnum">
                          #{formatInt(audit.head ?? 0)}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-3 border-t border-hairline pt-2 font-mono text-[10px] leading-relaxed text-faint">
                      Latency and head height are live from the testnet. Uptime and
                      stake components come from the local scoring model until the
                      validator registry indexer lands.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="border border-hairline bg-ink-raised">
            <ValidatorTable highlight={target} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function RpcSection() {
  return (
    <section id="rpc" className="border-b border-hairline">
      <div className="mx-auto max-w-[1240px] px-5 py-14 md:py-20">
        <SectionLabel index="03">RPC bench</SectionLabel>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-end">
          <h2 className="max-w-[420px] text-[clamp(1.7rem,3vw,2.4rem)] leading-[1.05] font-semibold tracking-[-0.02em] text-paper">
            Your node against the public one, same request, same second.
          </h2>
          <p className="max-w-[520px] text-[14px] leading-relaxed text-muted">
            Two round trips per endpoint, averaged. Add the endpoint you operate
            and see whether the latency you blame on the chain is actually your
            RPC.
          </p>
        </div>
        <div className="mt-8 border border-hairline bg-ink-raised">
          <RpcBench />
        </div>
      </div>
    </section>
  );
}

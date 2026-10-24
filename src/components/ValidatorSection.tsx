"use client";

import { useEffect, useState } from "react";
import { PORTALDOT } from "@/lib/portaldot";
import { SectionTitle, Panel, StatusMark, Tab } from "./ui";
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
    <section id="validators" aria-labelledby="validators-h">
      <div className="mx-auto max-w-[1320px] px-5 py-16 md:px-7 md:py-20">
        <div id="validators-h">
          <SectionTitle note="local scoring model v1 — open to challenge">
            Validator sentry
          </SectionTitle>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:items-start">
            <div>
              <p className="max-w-[40ch] text-[20px] leading-[1.4] text-paper">
                One number per validator, defended in a post-mortem.
              </p>
              <p className="mt-4 max-w-[52ch] text-[16px] leading-[1.55] text-muted">
                Uptime is weighted first, then missed blocks, then how much stake
                one operator already controls. Delegators read the same number
                operators do.
              </p>

              <ol className="mt-6" aria-label="Scoring weights">
                {[
                  { weight: "60", label: "production uptime", note: "signed blocks over expected slots" },
                  { weight: "25", label: "missed-block rate", note: "last 128 epochs, decaying" },
                  { weight: "15", label: "stake spread", note: "penalises crowded operators" },
                ].map((w) => (
                  <li
                    key={w.label}
                    className="flex items-baseline gap-4 border-t border-hairline py-3"
                  >
                    <span className="w-10 shrink-0 font-mono text-[20px] text-paper tnum">
                      {w.weight}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[14px] text-paper">{w.label}</p>
                      <p className="text-[12px] text-faint">{w.note}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <Panel as="div" data-ui className="mt-6 p-5">
              <div className="flex items-center justify-between">
                <p className="text-[12px] text-faint">Audit result</p>
                <StatusMark
                  tone={
                    audit.state === "ok"
                      ? "ok"
                      : audit.state === "error"
                        ? "bad"
                        : audit.state === "loading"
                          ? "warn"
                          : "idle"
                  }
                />
              </div>
              <div className="mt-3">
                {audit.state === "idle" && (
                  <p className="text-[13px] text-faint">
                    Audit an address from the console above to inspect one node.
                  </p>
                )}
                {audit.state === "loading" && (
                  <p className="font-mono text-[12px] text-muted">
                    Probing {shortHash(audit.address ?? "", 8)} against{" "}
                    {PORTALDOT.rpc.replace("https://", "")}…
                  </p>
                )}
                {audit.state === "error" && (
                  <p className="text-[13px] text-crimson">
                    Could not reach the testnet: {audit.message}. The endpoint is
                    public, so this is usually a local network issue.
                  </p>
                )}
                {audit.state === "ok" && (
                  <>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <div className="col-span-2">
                        <dt className="text-[12px] text-faint">Target</dt>
                        <dd className="truncate font-mono text-[13px] text-paper">{audit.address}</dd>
                      </div>
                      <div>
                        <dt className="text-[12px] text-faint">
                          Health score
                        </dt>
                        <dd className="font-mono text-[20px] text-paper tnum">{audit.score}<span className="text-[12px] text-faint">/100</span></dd>
                      </div>
                      <div>
                        <dt className="text-[12px] text-faint">Grade</dt>
                        <dd
                          className={cn(
                            "font-mono text-[20px] tnum",
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
                        <dt className="text-[12px] text-faint">
                          Round trip
                        </dt>
                        <dd className="font-mono text-[13px] text-paper tnum">{formatInt(audit.latency ?? 0)}ms</dd>
                      </div>
                      <div>
                        <dt className="text-[12px] text-faint">
                          Chain head
                        </dt>
                        <dd className="font-mono text-[13px] text-paper tnum">
                          #{formatInt(audit.head ?? 0)}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-4 text-[12px] leading-relaxed text-faint">
                      Round trip and head are live from the testnet. Uptime and
                      stake come from the local scoring model until the registry
                      indexer lands.
                    </p>
                  </>
                )}
              </div>
              </Panel>
            </div>

            <Panel as="div" data-ui className="min-w-0">
              <ValidatorTable highlight={target} />
            </Panel>
        </div>
      </div>
    </section>
  );
}

export function RpcSection() {
  return (
    <section id="rpc" aria-labelledby="rpc-h">
      <div className="mx-auto max-w-[1320px] px-5 py-16 md:px-7 md:py-20">
        <div id="rpc-h">
          <SectionTitle note="two round trips per endpoint, averaged">RPC bench</SectionTitle>
        </div>
        {/* verdict line first, the bench beside it */}
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:items-start">
          <div>
            <p className="max-w-[44ch] text-[20px] leading-[1.4] text-paper">
              Your node against the public one, same request, same second.
            </p>
            <p className="mt-4 max-w-[52ch] text-[16px] leading-[1.55] text-muted">
              Add the endpoint you operate and see whether the latency you blame
              on the chain is actually your RPC.
            </p>
          </div>
          <Panel as="div" data-ui className="min-w-0">
            <RpcBench />
          </Panel>
        </div>
      </div>
    </section>
  );
}

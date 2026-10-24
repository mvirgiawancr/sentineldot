"use client";

import { Clock3 } from "lucide-react";
import { PORTALDOT } from "@/lib/portaldot";
import { NetworkPulse } from "./NetworkPulse";
import { StatusDot } from "./ui";

const facts = [
  { label: "Chain", value: "Portaldot L0 · Substrate + EVM" },
  { label: "Endpoint", value: PORTALDOT.rpc.replace("https://", "") },
  { label: "Scoring", value: "uptime · missed blocks · stake spread" },
];

export function Hero({ onInspect }: { onInspect: (address: string) => void }) {
  return (
    <section id="top" className="relative overflow-hidden border-b border-hairline">
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-field opacity-[0.35]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald/40 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-emerald/[0.06] blur-[110px]"
      />

      <div className="relative mx-auto grid max-w-[1240px] gap-12 px-5 pt-16 pb-14 md:pt-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start lg:gap-14">
        <div className="max-w-[560px]">
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-emerald">
            <StatusDot tone="ok" pulse />
            Live testnet radar · chain {PORTALDOT.chainId}
          </p>

          <h1 className="mt-5 text-[clamp(2.4rem,5.2vw,3.9rem)] leading-[0.98] font-semibold tracking-[-0.03em] text-paper">
            Watch the chain breathe.
            <br />
            <span className="text-muted">Catch a failing node before it slashes.</span>
          </h1>

          <p className="mt-5 max-w-[480px] text-[15px] leading-relaxed text-muted">
            SentinelDot polls Portaldot block production directly from the
            testnet, then grades every validator on uptime, missed blocks and
            stake concentration. No dashboards to install, no agents to deploy.
          </p>

          <div className="mt-8 border-t border-hairline pt-5">
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
              {facts.map((f) => (
                <div key={f.label}>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                    {f.label}
                  </dt>
                  <dd className="mt-1 font-mono text-[11px] leading-snug text-muted">
                    {f.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -top-3 right-0 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            <Clock3 className="size-3" />
            polls every 4s
          </div>
          <NetworkPulse onInspect={onInspect} />
        </div>
      </div>
    </section>
  );
}

"use client";

import { PORTALDOT } from "@/lib/portaldot";
import { cn, formatInt } from "@/lib/utils";
import { StatusDot } from "./ui";
import { useTelemetry } from "@/lib/useTelemetry";

const links = [
  { href: "#telemetry", label: "Telemetry" },
  { href: "#validators", label: "Validators" },
  { href: "#rpc", label: "RPC bench" },
  { href: "#alerts", label: "Alerts" },
];

export function Navbar() {
  const t = useTelemetry(PORTALDOT.rpc);
  const tone =
    t.status === "live" ? "ok" : t.status === "down" ? "bad" : t.status === "connecting" ? "idle" : "warn";

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-6 px-5">
        <a href="#top" className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="grid size-5 place-items-center border border-emerald/50 bg-emerald/10 font-mono text-[10px] font-bold text-emerald"
          >
            S
          </span>
          <span className="font-mono text-[13px] tracking-[0.16em] text-paper">
            SENTINEL<span className="text-faint">DOT</span>
          </span>
        </a>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Sections">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13px] text-muted transition-colors hover:text-paper"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-4 border-r border-hairline pr-3 sm:flex">
            <span className="flex items-center gap-2 font-mono text-[11px] text-muted">
              <StatusDot tone={tone} pulse />
              {t.latencyMs ? `${formatInt(t.latencyMs)}ms` : "probing"}
            </span>
            <span
              className={cn(
                "font-mono text-[11px] text-paper tnum",
                t.block === 0 && "text-faint",
              )}
            >
              #{t.block ? formatInt(t.block) : "—"}
            </span>
          </div>
          <a
            href="#rpc"
            className="border border-hairline-bright px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-paper transition-colors hover:border-emerald/60 hover:text-emerald"
          >
            Run a probe
          </a>
        </div>
      </div>
    </header>
  );
}

"use client";

import { PORTALDOT } from "@/lib/portaldot";
import { formatInt } from "@/lib/utils";
import { useTelemetry } from "@/lib/useTelemetry";

const destinations = [
  { href: "#telemetry", label: "Telemetry" },
  { href: "#validators", label: "Validators" },
  { href: "#rpc", label: "RPC bench" },
  { href: "#alerts", label: "Alerts" },
];

export function Masthead() {
  const t = useTelemetry(PORTALDOT.rpc);

  return (
    <header className="border-b border-hairline">
      <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-8 px-5 md:px-7">
        <a href="#top" className="flex shrink-0 items-center gap-2">
          <Mark />
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-paper">
            SentinelDot
          </span>
        </a>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Sections">
          {destinations.map((d) => (
            <a
              key={d.href}
              href={d.href}
              className="text-[13px] text-faint transition-colors hover:text-paper"
            >
              {d.label}
            </a>
          ))}
        </nav>

        {/* the freshness stamp: what the numbers are from, and when */}
        <div className="ml-auto flex items-center gap-5 text-[12px] tnum">
          <span className="hidden text-faint sm:inline">
            head{" "}
            <span className="font-mono text-paper">
              {t.block ? formatInt(t.block) : "—"}
            </span>
          </span>
          <span className="hidden text-faint sm:inline">
            rtt{" "}
            <span className="font-mono text-paper">
              {t.latencyMs ? `${formatInt(t.latencyMs)}ms` : "—"}
            </span>
          </span>
          <span className="text-faint">
            {t.status === "live"
              ? "live · testnet"
              : t.status === "connecting"
                ? "connecting"
                : t.status === "down"
                  ? "unreachable"
                  : "degraded"}
          </span>
        </div>
      </div>
    </header>
  );
}

/** A sentry mark: the tip of a scanning arc, drawn for this product. */
function Mark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden className="shrink-0">
      <path d="M10 18 A8 8 0 0 1 10 2" fill="none" stroke="var(--color-hairline-bright)" strokeWidth="1.5" />
      <path d="M10 18 A8 8 0 0 1 18 10" fill="none" stroke="var(--color-signal)" strokeWidth="1.5" />
      <circle cx="10" cy="18" r="1.75" fill="var(--color-paper)" />
    </svg>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { PORTALDOT, TARGET_BLOCK_SECONDS } from "@/lib/portaldot";
import { useTelemetry } from "@/lib/useTelemetry";
import { formatInt } from "@/lib/utils";
import { StatusMark } from "./ui";

export function HeroConsole({ onInspect }: { onInspect: (address: string) => void }) {
  const t = useTelemetry(PORTALDOT.rpc);
  const [query, setQuery] = useState("");
  const [fresh, setFresh] = useState(0);
  const last = useRef(0);

  useEffect(() => {
    if (t.block > 0 && t.block !== last.current) {
      if (last.current > 0) setFresh((n) => n + 1);
      last.current = t.block;
    }
  }, [t.block]);

  const reading =
    t.lag > 0
      ? `Head moved backwards ${t.lag} blocks — the endpoint is lagging its own load balancer.`
      : t.status === "down"
        ? "The endpoint is unreachable from this browser."
        : t.blockTime > 0
          ? `Block interval ${t.blockTime.toFixed(1)}s against a ${TARGET_BLOCK_SECONDS.toFixed(0)}s target, from chain timestamps across ${t.delta} blocks this session.`
          : "Opening the first round trip to the testnet…";

  return (
    <section aria-label="SentinelDot live console" className="px-3 pt-3 md:px-4 md:pt-4">
      <div className="relative flex min-h-[calc(100svh-24px)] flex-col overflow-hidden rounded-[12px] bg-ink-raised md:min-h-[calc(100svh-32px)]">
        {/* background: real dish photo under a dark scrim, radar wireframe tracing over it */}
        <img
          src="/img/hero-dish.jpg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-55 select-none"
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-ink/45" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-ink-sunken via-ink-sunken/45 to-transparent"
        />
        <RadarWireframe />

        {/* top bar inside the frame */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-5 md:px-8 md:pt-6">
          <a href="#top" className="flex items-center gap-2">
            <Mark />
            <span className="text-[15px] font-semibold tracking-[-0.01em] text-paper">
              SentinelDot
            </span>
          </a>
          <a
            href="#rpc"
            className="bg-paper px-4 py-2 text-[13px] font-medium text-ink transition-opacity hover:opacity-90"
          >
            Run a probe
          </a>
        </div>

        {/* small honest label, like the [ foto ] tag in Atelier Sora */}
        <div className="relative z-10 px-5 md:px-8">
          <p className="mt-5 inline-block bg-ink/80 px-2.5 py-1 font-mono text-[11px] text-muted tnum backdrop-blur-sm">
            [ live testnet · chain {PORTALDOT.chainId} ]
          </p>
        </div>

        {/* the arch: live data as the big shape on the right */}
        <div
          aria-hidden={false}
          className="pointer-events-none absolute right-[3%] top-[13%] z-10 hidden w-[min(38vw,520px)] md:block lg:w-[440px]"
        >
          <div className="relative overflow-hidden rounded-t-full border border-hairline bg-ink/90 px-8 pb-8 pt-[22%] backdrop-blur-md">
            <div className="text-center">
              <p className="font-mono text-[11px] text-faint">latest block</p>
              <p key={fresh} className="tick-in mt-1 font-mono text-[44px] leading-none text-paper tnum">
                {t.block ? formatInt(t.block) : "—"}
              </p>
              <p className="mt-2 font-mono text-[11px] text-faint tnum">
                {t.latencyMs ? `${formatInt(t.latencyMs)}ms round trip` : "first poll…"}
              </p>
            </div>
            <div className="mt-5">
              <ArchTrace values={t.rtt} />
            </div>
            {/* small inner arch, like the green one in the reference */}
            <div className="mx-auto mt-6 w-[46%] rounded-t-full border border-hairline bg-ink-sunken px-4 pb-5 pt-[16%] text-center">
              <StatusMark
                tone={t.lag > 0 ? "warn" : t.status === "live" ? "ok" : t.status === "down" ? "bad" : "idle"}
              />
              <p className="mt-2 font-mono text-[11px] text-muted">
                {t.lag > 0 ? `−${t.lag} regressed` : t.status}
              </p>
              <p className="mt-1 font-mono text-[11px] text-paper tnum">
                {t.blockTime ? `${t.blockTime.toFixed(1)}s` : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* mobile arch: same content, stacked */}
        <div className="relative z-10 px-5 pt-8 md:hidden">
          <div className="overflow-hidden rounded-t-full border border-hairline bg-ink/90 px-6 pb-6 pt-[18%] text-center">
            <p className="font-mono text-[11px] text-faint">latest block</p>
            <p className="mt-1 font-mono text-[36px] leading-none text-paper tnum">
              {t.block ? formatInt(t.block) : "—"}
            </p>
            <div className="mt-4">
              <ArchTrace values={t.rtt} />
            </div>
          </div>
        </div>

        {/* bottom band: headline left, info right */}
        <div className="relative z-10 mt-auto border-t border-hairline/60 bg-ink-sunken/90 px-5 pb-8 pt-8 backdrop-blur-md md:px-8 md:pb-10">
          <div className="grid gap-8 md:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] md:items-end">
            <h1 className="max-w-[14ch] text-[clamp(2.6rem,6.5vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-paper">
              Every block,
              <br />
              timed live
              <br />
              as it lands.
            </h1>
            <div className="max-w-[38ch]">
              <p className="text-[16px] leading-[1.55] text-muted">{reading}</p>
              <form
                className="mt-4 flex max-w-[360px] items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (query.trim()) onInspect(query.trim());
                }}
              >
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Paste a validator address…"
                  aria-label="Validator address to audit"
                  spellCheck={false}
                  className="h-[34px] min-w-0 flex-1 border border-hairline-bright bg-ink px-3 font-mono text-[12px] text-paper placeholder:text-faint focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!query.trim()}
                  className="h-[34px] shrink-0 bg-paper px-4 text-[13px] font-medium text-ink disabled:opacity-40"
                >
                  Audit
                </button>
              </form>
              <a
                href="#telemetry"
                className="mt-3 inline-block text-[14px] text-paper underline underline-offset-4"
              >
                See the block tape
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * 3D-ish wireframe radar: concentric polar rings tilted in 3D perspective
 * sitting quietly in the background of the frame — gives depth without
 * running a heavy WebGL/Three.js loop on modest hardware.
 */
function RadarWireframe() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden opacity-20 select-none"
    >
      <svg
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
      >
        <defs>
          <linearGradient id="fade-down" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-paper)" stopOpacity="0.5" />
            <stop offset="60%" stopColor="var(--color-signal)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-signal)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* perspective grid base */}
        <g stroke="url(#fade-down)" strokeWidth="0.75" fill="none">
          {/* concentric tilted ellipses (radar rings in 3D ground plane) */}
          {[120, 200, 300, 420, 560, 720].map((rx, i) => (
            <ellipse
              key={rx}
              cx="720"
              cy="340"
              rx={rx}
              ry={rx * 0.38}
              strokeDasharray={i % 2 === 1 ? "3 5" : undefined}
            />
          ))}

          {/* radial spokes shooting out from the telemetry pole */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const x2 = 720 + Math.cos(rad) * 720;
            const y2 = 340 + Math.sin(rad) * (720 * 0.38);
            return (
              <line
                key={deg}
                x1="720"
                y1="340"
                x2={x2}
                y2={y2}
                strokeOpacity="0.4"
              />
            );
          })}

          {/* vertical telemetry axis (the sentry antenna) */}
          <line x1="720" y1="60" x2="720" y2="620" strokeWidth="1" strokeOpacity="0.7" />
          {/* cross-marks along the axis */}
          {[120, 180, 240, 300, 340, 400, 480].map((y) => (
            <line key={y} x1="710" y1={y} x2="730" y2={y} strokeOpacity="0.6" />
          ))}

          {/* azimuth degree ticks */}
          <circle cx="720" cy="340" r="3" fill="var(--color-paper)" />
        </g>
      </svg>
    </div>
  );
}

function Mark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden className="shrink-0">
      <path d="M10 18 A8 8 0 0 1 10 2" fill="none" stroke="var(--color-hairline-bright)" strokeWidth="1.5" />
      <path d="M10 18 A8 8 0 0 1 18 10" fill="none" stroke="var(--color-signal)" strokeWidth="1.5" />
      <circle cx="10" cy="18" r="1.75" fill="var(--color-paper)" />
    </svg>
  );
}

function ArchTrace({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <p className="py-4 text-center font-mono text-[11px] text-faint">drawing…</p>;
  }
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const pts = values.map((v, i) => {
    const x = 4 + (i / (values.length - 1)) * 92;
    const y = 52 - ((v - lo) / span) * 44;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="h-[64px] w-full" role="img" aria-label={`RTT from ${lo} to ${hi} milliseconds`}>
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="var(--color-paper)"
        strokeOpacity="0.85"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

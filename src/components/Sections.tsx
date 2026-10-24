import { SectionLabel } from "./ui";
import { TelemetryTicker, AlertBuilder } from "./Telemetry";

export function TelemetrySection() {
  return (
    <section id="telemetry" className="border-b border-hairline">
      <div className="mx-auto max-w-[1240px] px-5 py-14 md:py-20">
        <SectionLabel index="01">Telemetry</SectionLabel>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-end">
          <h2 className="max-w-[420px] text-[clamp(1.7rem,3vw,2.4rem)] leading-[1.05] font-semibold tracking-[-0.02em] text-paper">
            Every block, every gap, stamped with the round-trip that produced it.
          </h2>
          <p className="max-w-[520px] text-[14px] leading-relaxed text-muted">
            Each poll records the block height, the chain timestamp and the round
            trip to your endpoint. SentinelDot derives the real block interval
            from chain timestamps rather than wall-clock guesses, so a stalled
            node looks different from a slow one.
          </p>
        </div>
        <div className="mt-8 border border-hairline">
          <TelemetryTicker />
        </div>
      </div>
    </section>
  );
}

export function AlertsSection() {
  return (
    <section id="alerts" className="border-b border-hairline">
      <div className="mx-auto max-w-[1240px] px-5 py-14 md:py-20">
        <SectionLabel index="04">Alert builder</SectionLabel>
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <h2 className="max-w-[380px] text-[clamp(1.7rem,3vw,2.4rem)] leading-[1.05] font-semibold tracking-[-0.02em] text-paper">
              Turn a missed block into a config file.
            </h2>
            <p className="mt-4 max-w-[420px] text-[14px] leading-relaxed text-muted">
              Pick the endpoint you run, choose how many missed blocks you can
              tolerate, and copy a ready-to-paste scraper or service unit.
            </p>
          </div>
          <div className="border border-hairline">
            <AlertBuilder />
          </div>
        </div>
      </div>
    </section>
  );
}

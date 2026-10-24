import { SectionTitle, Panel } from "./ui";
import { TelemetryTicker, AlertBuilder } from "./Telemetry";

export function TelemetrySection() {
  return (
    <section id="telemetry" aria-labelledby="telemetry-h">
      <div className="mx-auto max-w-[1320px] px-5 py-16 md:px-7 md:py-20">
        <div id="telemetry-h">
          <SectionTitle note="from chain timestamps, not wall clock">
            Block telemetry
          </SectionTitle>
        </div>
        {/* split: what it means on the left, the tape beside it */}
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:items-start">
          <div>
            <p className="max-w-[44ch] text-[20px] leading-[1.4] text-paper">
              Every block arrives with the round trip that fetched it.
            </p>
            <p className="mt-4 max-w-[52ch] text-[16px] leading-[1.55] text-muted">
              Each poll records the height, the chain timestamp and the time your
              browser waited. The interval is derived from consecutive timestamps,
              so a stalled node reads as a gap — and a slow connection reads as
              one, honestly labelled.
            </p>
            <dl className="mt-8 space-y-4">
              {[
                ["gap over 1.5× target", "the poll is flagged, but the row stays"],
                ["head moves backwards", "counted as a regressed block, not hidden"],
                ["poll fails", "the last good numbers stay up with a retry note"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline gap-4 text-[14px]">
                  <dt className="shrink-0 font-mono text-[12px] text-paper tnum">{k}</dt>
                  <dd className="text-muted">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <Panel as="figure" data-ui className="min-w-0">
            <TelemetryTicker />
          </Panel>
        </div>
      </div>
    </section>
  );
}

export function AlertsSection() {
  return (
    <section id="alerts" aria-labelledby="alerts-h">
      <div className="mx-auto max-w-[1320px] px-5 py-16 md:px-7 md:py-20">
        <div id="alerts-h">
          <SectionTitle note="prometheus · systemd · curl">Take the config with you</SectionTitle>
        </div>
        {/* statement meets builder: left persuades, right works */}
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
          <Panel as="div" data-ui className="order-2 min-w-0 lg:order-1">
            <AlertBuilder />
          </Panel>
          <div className="order-1 lg:order-2">
            <p className="max-w-[44ch] text-[20px] leading-[1.4] text-paper">
              A missed block becomes a config file before the page goes down.
            </p>
            <p className="mt-4 max-w-[52ch] text-[16px] leading-[1.55] text-muted">
              Pick the endpoint you run, set how many missed blocks you can
              tolerate, and copy a scraper or a service unit. The thresholds are
              yours — SentinelDot only describes what it sees.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

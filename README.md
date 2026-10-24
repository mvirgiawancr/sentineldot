# SentinelDot

Node telemetry and validator sentry for the Portaldot V3 testnet.

Portaldot operators get pager alerts after a node has already stalled. SentinelDot watches the chain itself — block cadence, RPC round-trip time, served head movement — so a degrading node shows up as a trend before it shows up as a downtime page.

Built for **Portaldot Hacker House 2026**, Track 1: Node Operations & Tooling.

## What it does

- **RTT trace** — round-trip time to the RPC endpoint, plotted live in the hero. Slowdowns are visible as a curve, not a single red dot.
- **Block cadence tape** — the last 32 blocks with proportional widths along a time axis. Any gap over 1.5× target block time is flagged amber, anything above 2.5× turns crimson. The tape backfills on mount, so a stale load balancer showing you an old head does not give you an empty panel.
- **Head regression detection** — if the served head goes backwards between polls, SentinelDot flags the endpoint as lagging and reports how many blocks behind it is. This is not a hypothetical: the public V3 endpoint did exactly this during development (served `171,184`, then `171,127` on the next poll).
- **Validator sentry table** — stake, commission, uptime, missed blocks, and a composite grade per validator, plus an audit panel that explains what each column is derived from.
- **RPC bench** — latency and head agreement across configured endpoints.
- **Alert config generator** — emits Prometheus scrape config, a systemd unit, and a raw curl probe for the endpoint you are watching.

## Metrics and honesty

Every number on the page is either measured live or labeled.

| Metric | Source |
| --- | --- |
| Block interval | Median of the last 5 chain timestamps (`gap > 1.5×` target flagged) |
| Target block time | 6.0s, measured on V3 during development |
| Base fee | `baseFeePerGas` from the head block, in wei |
| RPC latency | Real `performance.now()` around each JSON-RPC round trip |
| Head regression | Real served-head comparison between consecutive polls |
| Validator stake / fee / uptime | **Mock, deterministic** |
| Validator grade | **Scoring model v1, computed locally** |

The validator list is seeded fixture data, not a live registry read. Portaldot's validator set is not exposed over the EVM JSON-RPC surface, so those rows are placeholders shaped like real data. They demonstrate the table and scoring model. They are not a report on any real operator.

Grade is a weighted score: uptime 40%, missed blocks 30%, commission 15%, stake 15%. Model version is printed in the table footer so it can be versioned and challenged.

If a metric cannot be measured, it shows a dash rather than a fabricated value.

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000. The dashboard talks to the public testnet from the browser; no keys, no backend, no database.

```bash
npm run build && npm start   # production
```

## Configuration

Chain endpoints live in `src/lib/portaldot.ts`:

```ts
export const PORTALDOT = {
  name: "PortaldotV3 Testnet",
  chainId: 420420777,
  rpc: "https://test-evm-rpc-v3.portaldot.dev",
  wss: "wss://test-node-v3.portaldot.dev",
  explorer: "https://node-console.portaldot.dev",
};
```

To point SentinelDot at your own node, change `rpc` and drop the reference entry in `ENDPOINTS`. Poll interval and history depth are constants at the top of `src/lib/useTelemetry.ts`.

## Testnet findings

Measured against the V3 public endpoint during the build:

- Block time is a flat 6.0s across consecutive timestamps.
- Base fee held at `0x7f4e`, about 32,590 wei, with zero transactions per block. The chain is idle at the time of writing, so the tape is uniform until traffic picks up.
- RTT ranged 92–350ms to Bandung, with occasional spikes past 1,000ms. Those spikes are real and are what the trace is for.
- The load balancer in front of the endpoint served regressed heads more than once. This is the failure mode SentinelDot exists to catch.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · TypeScript · lucide-react

## Project layout

```
src/
  app/            layout, page, global styles
  components/     Navbar, Hero, NetworkPulse, Telemetry,
                  ValidatorTable, ValidatorSection, RpcBench,
                  Sections, Footer
  lib/            portaldot (chain config), rpc (probe),
                  useTelemetry (polling hook), utils
```

## License

MIT

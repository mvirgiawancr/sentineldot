import { PORTALDOT } from "@/lib/portaldot";

export function Footer() {
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-10 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <p className="font-mono text-[13px] tracking-[0.16em] text-paper">
            SENTINEL<span className="text-faint">DOT</span>
          </p>
          <p className="mt-2 max-w-[280px] text-[13px] leading-relaxed text-muted">
            Observability for Portaldot node operators. Built for the
            Portaldot Hacker House, running against the live testnet.
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            Endpoints
          </p>
          <ul className="mt-2 space-y-1 font-mono text-[11px] text-muted">
            <li>{PORTALDOT.rpc.replace("https://", "")}</li>
            <li>{PORTALDOT.wss.replace("wss://", "")}</li>
            <li>chain id {PORTALDOT.chainId}</li>
          </ul>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            Source
          </p>
          <ul className="mt-2 space-y-1 font-mono text-[11px] text-muted">
            <li>
              <a className="hover:text-paper" href={PORTALDOT.explorer} target="_blank" rel="noreferrer">
                node console
              </a>
            </li>
            <li>
              <a
                className="hover:text-paper"
                href="https://github.com/portaldotVolunteer/Portaldot"
                target="_blank"
                rel="noreferrer"
              >
                portaldot core
              </a>
            </li>
            <li>
              <a
                className="hover:text-paper"
                href="https://portaldot-dev.readthedocs.io"
                target="_blank"
                rel="noreferrer"
              >
                developer docs
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-hairline">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-2 px-5 py-3 font-mono text-[10px] text-faint">
          <span>© 2026 SentinelDot · MIT</span>
          <span>testnet data · not financial advice</span>
        </div>
      </div>
    </footer>
  );
}

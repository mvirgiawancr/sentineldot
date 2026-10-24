import { PORTALDOT } from "@/lib/portaldot";

export function Footer() {
  return (
    <footer className="mx-auto max-w-[1320px] px-5 pb-10 pt-4 md:px-7">
      <p className="text-[26px] font-semibold tracking-[-0.015em] text-paper">
        SentinelDot
      </p>
      <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-[13px] text-faint">
        <a className="hover:text-paper" href={PORTALDOT.explorer} target="_blank" rel="noreferrer">
          Node console
        </a>
        <a
          className="hover:text-paper"
          href="https://github.com/portaldotVolunteer/Portaldot"
          target="_blank"
          rel="noreferrer"
        >
          Portaldot core
        </a>
        <a
          className="hover:text-paper"
          href="https://portaldot-dev.readthedocs.io"
          target="_blank"
          rel="noreferrer"
        >
          Developer docs
        </a>
      </div>
      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-2 border-t border-hairline pt-4 text-[12px] text-faint">
        <span>© 2026 SentinelDot · MIT</span>
        <span className="font-mono">
          {PORTALDOT.rpc.replace("https://", "")} · chain {PORTALDOT.chainId}
        </span>
      </div>
    </footer>
  );
}

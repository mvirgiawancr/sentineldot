"use client";

import { useState } from "react";
import { HeroConsole } from "@/components/Hero";
import { Masthead } from "@/components/Navbar";
import { TelemetrySection, AlertsSection } from "@/components/Sections";
import { RpcSection, ValidatorsSection } from "@/components/ValidatorSection";
import { Footer } from "@/components/Footer";

export default function Home() {
  const [target, setTarget] = useState<string | null>(null);

  function inspect(address: string) {
    setTarget(address);
    document.getElementById("validators")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <Masthead />
      <main id="top">
        {/* the one inset frame on the page: the instrument itself */}
        <div className="mx-auto max-w-[1320px] px-4 pt-6 md:px-5 md:pt-8">
          <HeroConsole onInspect={inspect} />
          <p className="mt-3 text-[12px] text-faint">
            SentinelDot watches the Portaldot V3 testnet from your browser — no agent to
            install, no account. Point it at your own node when you run one.
          </p>
        </div>
        <TelemetrySection />
        <ValidatorsSection target={target} />
        <RpcSection />
        <AlertsSection />
      </main>
      <Footer />
    </>
  );
}

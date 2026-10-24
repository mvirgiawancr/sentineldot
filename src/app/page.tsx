"use client";

import { useState } from "react";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { AlertsSection, TelemetrySection } from "@/components/Sections";
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
      <Navbar />
      <main>
        <Hero onInspect={inspect} />
        <TelemetrySection />
        <ValidatorsSection target={target} />
        <RpcSection />
        <AlertsSection />
      </main>
      <Footer />
    </>
  );
}

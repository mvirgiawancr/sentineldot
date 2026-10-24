import { cn } from "@/lib/utils";

export function SectionLabel({
  index,
  children,
  className,
}: {
  index: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline gap-3 border-b border-hairline pb-3",
        className,
      )}
    >
      <span className="font-mono text-[11px] tracking-[0.18em] text-faint">
        {index}
      </span>
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
        {children}
      </span>
    </div>
  );
}

export function Panel({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  return (
    <Tag className={cn("border border-hairline bg-ink-raised", className)}>
      {children}
    </Tag>
  );
}

export function StatusDot({
  tone,
  pulse = false,
}: {
  tone: "ok" | "warn" | "bad" | "idle";
  pulse?: boolean;
}) {
  const color =
    tone === "ok"
      ? "bg-emerald"
      : tone === "warn"
        ? "bg-amber"
        : tone === "bad"
          ? "bg-crimson"
          : "bg-faint";
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-[6px] shrink-0 rounded-full",
        color,
        pulse && tone === "ok" && "live-dot",
      )}
    />
  );
}

export function KeyValue({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4", className)}>
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
        {label}
      </span>
      <span className="font-mono text-[12px] text-paper tnum">{children}</span>
    </div>
  );
}

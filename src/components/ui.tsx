import { cn } from "@/lib/utils";

/**
 * Panel: a surface one step darker than the ground, separated by lightness
 * alone. No border, no shadow — the style's elevation rule.
 */
export function Panel({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "figure";
}) {
  return <Tag className={cn("bg-ink-raised", className)}>{children}</Tag>;
}

/**
 * SectionTitle: a noun, sentence case, at 20px in muted grey — the app-screen
 * convention. No index numbers, no tracked capitals.
 */
export function SectionTitle({
  children,
  note,
  className,
}: {
  children: React.ReactNode;
  note?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4", className)}>
      <h2 className="text-[20px] leading-tight font-normal text-faint">{children}</h2>
      {note ? <p className="text-[12px] text-faint tnum">{note}</p> : null}
    </div>
  );
}

/**
 * StatusMark: one mark per row, and it marks a real state. Square 6px, no
 * glow. The pulse is a single one-shot animation on state change, never a loop.
 */
export function StatusMark({ tone }: { tone: "ok" | "warn" | "bad" | "idle" }) {
  const color =
    tone === "ok"
      ? "bg-emerald-deep"
      : tone === "warn"
        ? "bg-amber"
        : tone === "bad"
          ? "bg-crimson"
          : "bg-faint";
  return <span aria-hidden className={cn("inline-block size-[6px] shrink-0", color)} />;
}

/**
 * Tab: the style's move — the selection is a 1px accent line exactly as wide
 * as the label, sitting on the existing bottom edge. Not a pill, not a fill.
 */
export function Tab({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative pb-2 text-[13px] transition-colors",
        active ? "text-paper" : "text-faint hover:text-muted",
        className,
      )}
    >
      {children}
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 -bottom-px h-px",
          active ? "bg-signal" : "bg-transparent",
        )}
      />
    </button>
  );
}

/** A missing value is a dash; a real zero is printed. */
export function Dash() {
  return <span className="text-faint">—</span>;
}

/** Unit suffix: one size smaller, grey, never shouting beside the figure. */
export function Unit({ children }: { children: React.ReactNode }) {
  return <span className="ml-1 text-[12px] font-normal text-faint">{children}</span>;
}

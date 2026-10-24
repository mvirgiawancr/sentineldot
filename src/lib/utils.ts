import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatInt(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatWei(wei: number): string {
  if (!wei) return "—";
  if (wei >= 1e9) return `${(wei / 1e9).toFixed(3)} POT/gas`;
  if (wei >= 1e3) return `${formatInt(Math.round(wei))} wei`;
  return `${wei} wei`;
}

export function shortHash(value: string, size = 6): string {
  if (value.length <= size * 2 + 2) return value;
  return `${value.slice(0, size + 2)}…${value.slice(-size)}`;
}

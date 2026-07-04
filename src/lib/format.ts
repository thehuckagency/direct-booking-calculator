import { CONFIG } from "../config";

const gbp0 = new Intl.NumberFormat(CONFIG.locale, {
  style: "currency",
  currency: CONFIG.currency,
  maximumFractionDigits: 0,
});

const num0 = new Intl.NumberFormat(CONFIG.locale, { maximumFractionDigits: 0 });

/** £1,234 — no decimals, thousands separators. */
export function money(v: number): string {
  return gbp0.format(Number.isFinite(v) ? v : 0);
}

/** 1,234 — thousands separators, no currency symbol. */
export function integer(v: number): string {
  return num0.format(Number.isFinite(v) ? v : 0);
}

/** Trim a trailing ".0" from half-step percentages (17.5 stays, 17.0 -> 17). */
export function percent(v: number): string {
  const rounded = Math.round(v * 10) / 10;
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
}

import type { RecoveryResult } from "../lib/calculateRecovery";
import { money, percent } from "../lib/format";
import { useCountUp } from "../lib/hooks";

/** The big animated recovery figure. */
function Headline({ value }: { value: number }) {
  const animated = useCountUp(value);
  return (
    <p className="tabular font-display text-[clamp(2.9rem,7vw,4.75rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-ink">
      {money(Math.round(animated))}
    </p>
  );
}

function StatCard({
  label,
  value,
  unit,
  tone = "default",
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: "default" | "gain";
}) {
  return (
    <div className="min-w-0 rounded-xl border border-sage/60 bg-surface px-3.5 py-3.5">
      <p className="text-[11.5px] font-medium uppercase tracking-[0.03em] text-muted">{label}</p>
      <p
        className={`tabular mt-1 flex flex-wrap items-baseline text-[clamp(0.95rem,4.4vw,1.2rem)] font-semibold leading-tight ${
          tone === "gain" ? "text-gain" : "text-ink"
        }`}
      >
        {value}
        {unit ? <span className="ml-0.5 text-[0.7em] font-medium text-muted">{unit}</span> : null}
      </p>
    </div>
  );
}

/**
 * Two horizontal bars comparing OTA commission now vs the residual cost after
 * shifting. Widths are proportional to the "now" figure so the reduction reads
 * at a glance. Animates via CSS width transition (reduced-motion safe).
 */
function ComparisonBars({ result }: { result: RecoveryResult }) {
  const now = result.currentCommissionCost;
  const after = Math.max(0, now - result.netAnnualRecovery);
  const afterPct = now > 0 ? Math.max(2, (after / now) * 100) : 2;

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-[13.5px] font-medium text-muted">OTA cost now</span>
          <span className="tabular text-[14px] font-semibold text-ink">{money(now)}</span>
        </div>
        <div className="h-3.5 w-full overflow-hidden rounded-full bg-surface-sunk">
          <div
            className="h-full rounded-full bg-ink transition-[width] duration-700 ease-out-quint"
            style={{ width: "100%" }}
          />
        </div>
      </div>
      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-[13.5px] font-medium text-muted">Cost after shift</span>
          <span className="tabular text-[14px] font-semibold text-gain">{money(after)}</span>
        </div>
        <div className="h-3.5 w-full overflow-hidden rounded-full bg-surface-sunk">
          <div
            className="h-full rounded-full bg-gain transition-[width] duration-700 ease-out-quint"
            style={{ width: `${afterPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function Results({
  result,
  targetShift,
}: {
  result: RecoveryResult;
  targetShift: number;
}) {
  return (
    <div className="space-y-7">
      {/* Headline */}
      <div>
        <h2 className="text-[15px] font-medium text-muted">You could recover around</h2>
        <Headline value={result.netAnnualRecovery} />
        <p className="mt-1 text-[15px] font-medium text-muted">a year</p>
      </div>

      {result.directCostExceedsCommission && (
        <p className="rounded-xl border border-sage/70 bg-surface-sunk px-4 py-3 text-[13.5px] leading-snug text-muted">
          At these settings your direct cost of sale is the same as or higher than the OTA
          commission, so moving bookings direct does not pay off yet. Direct only wins below the
          commission rate.
        </p>
      )}

      {/* Supporting stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Paid to OTAs now" value={money(result.currentCommissionCost)} unit="/yr" />
        <StatCard label="Recovered monthly" value={money(result.monthlyRecovery)} tone="gain" />
        <StatCard label="Over 3 years" value={money(result.threeYearRecovery)} tone="gain" />
      </div>

      {/* Comparison chart */}
      <ComparisonBars result={result} />

      {/* Plain-English sentence */}
      <p className="border-t border-sage/50 pt-5 text-[15.5px] leading-relaxed text-ink">
        Right now you are paying about{" "}
        <strong className="font-semibold">{money(result.currentCommissionCost)}</strong> a year in
        OTA commission. Move just <strong className="font-semibold">{percent(targetShift)}</strong> of
        those bookings to direct and you keep more of every reservation.
      </p>
    </div>
  );
}

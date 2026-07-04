import { useId } from "react";
import { InfoTooltip } from "./InfoTooltip";

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** Formatted value shown on the right (e.g. "40%"). */
  display: string;
  source?: string;
  onChange: (v: number) => void;
}

/** A labelled, keyboard-operable slider with a live value readout. */
export function SliderRow({
  label,
  value,
  min,
  max,
  step,
  display,
  source,
  onChange,
}: SliderRowProps) {
  const id = useId();
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="flex items-center gap-1.5 text-[15px] font-medium text-ink">
          {label}
          {source ? <InfoTooltip label={label} source={source} /> : null}
        </label>
        <span className="tabular text-[15px] font-semibold text-ink">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        className="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** Symbol shown inside the field, e.g. "£" (prefix) or "%" (suffix). */
  prefix?: string;
  suffix?: string;
  source?: string;
  onChange: (v: number) => void;
}

/** A labelled numeric input with optional unit adornment and tooltip. */
export function NumberField({
  label,
  value,
  min,
  max,
  step,
  prefix,
  suffix,
  source,
  onChange,
}: NumberFieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-2 flex items-center gap-1.5 text-[15px] font-medium text-ink">
        {label}
        {source ? <InfoTooltip label={label} source={source} /> : null}
      </label>
      <div className="relative">
        {prefix ? (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
            {prefix}
          </span>
        ) : null}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          className={`field tabular ${prefix ? "pl-8" : ""} ${suffix ? "pr-8" : ""}`}
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") return onChange(0);
            onChange(Number(raw));
          }}
          onBlur={(e) => {
            // Clamp to range on blur so typed values stay valid.
            const v = Number(e.target.value);
            if (!Number.isFinite(v)) return onChange(min);
            onChange(Math.min(Math.max(v, min), max));
          }}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted">
            {suffix}
          </span>
        ) : null}
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { CONFIG } from "./config";
import { calculateRecovery, type RecoveryInputs, type RevenuePath } from "./lib/calculateRecovery";
import { money, percent } from "./lib/format";
import { useDebouncedValue } from "./lib/hooks";
import { Logo } from "./components/Logo";
import { NumberField, SliderRow } from "./components/Inputs";
import { Results } from "./components/Results";
import { EmailGate } from "./components/EmailGate";

export default function App() {
  const [path, setPath] = useState<RevenuePath>("A");
  const [adr, setAdr] = useState(CONFIG.adr.default);
  const [monthlyRoomNights, setMonthlyRoomNights] = useState(CONFIG.monthlyRoomNights.default);
  const [rooms, setRooms] = useState(CONFIG.rooms.default);
  const [occupancy, setOccupancy] = useState(CONFIG.occupancy.default);
  const [otaShare, setOtaShare] = useState(CONFIG.otaShare.default);
  const [commission, setCommission] = useState(CONFIG.commission.default);
  const [targetShift, setTargetShift] = useState(CONFIG.targetShift.default);
  const [directCostOfSale, setDirectCostOfSale] = useState(CONFIG.directCostOfSale.default);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Memoised so its reference is stable while values are unchanged — otherwise
  // the debounce below re-fires on every render and never settles.
  const inputs = useMemo<RecoveryInputs>(
    () => ({
      path,
      adr,
      monthlyRoomNights,
      rooms,
      occupancy,
      otaShare,
      commission,
      targetShift,
      directCostOfSale,
    }),
    [path, adr, monthlyRoomNights, rooms, occupancy, otaShare, commission, targetShift, directCostOfSale],
  );

  // Debounce so the animated result eases rather than jitters while dragging.
  const debounced = useDebouncedValue(inputs, 90);
  const result = useMemo(() => calculateRecovery(debounced), [debounced]);
  // The gate submits the live (non-debounced) figures.
  const liveResult = useMemo(() => calculateRecovery(inputs), [inputs]);

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 pb-2 pt-7 sm:px-8">
        <Logo className="h-6 w-auto text-ink sm:h-7" />
        <span className="text-[13px] font-medium text-muted">Direct booking recovery</span>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pb-8 pt-8 sm:px-8 sm:pt-12">
        <h1 className="max-w-4xl text-balance font-display text-[clamp(2.1rem,5.4vw,3.6rem)] font-semibold leading-[1.03] tracking-[-0.025em] text-ink">
          See how much your hotel is losing to OTA commission
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-[17px] leading-relaxed text-muted sm:text-[18px]">
          Every Booking.com and Expedia reservation quietly takes 15 to 25% of your room revenue.
          Answer three quick questions and we will show you what that costs you a year, and how much
          you could win back by shifting more bookings direct.
        </p>
      </section>

      {/* Calculator */}
      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-8">
          {/* Inputs */}
          <div className="rounded-2xl border border-sage/50 bg-surface/60 p-6 shadow-card sm:p-8">
            <p className="text-[15px] leading-relaxed text-muted">
              Adjust the numbers to match your property. The result updates as you go.
            </p>

            {/* Revenue basis toggle */}
            <div className="mt-6">
              <span className="mb-2 block text-[13px] font-semibold uppercase tracking-[0.05em] text-muted">
                How do you want to enter room volume?
              </span>
              <div
                role="tablist"
                aria-label="Room revenue basis"
                className="inline-flex rounded-full border border-sage/70 bg-surface-sunk p-1"
              >
                {(
                  [
                    ["A", "Room nights"],
                    ["B", "Rooms + occupancy"],
                  ] as const
                ).map(([key, lbl]) => (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={path === key}
                    onClick={() => setPath(key)}
                    className={`focus-ring rounded-full px-4 py-2 text-[13.5px] font-semibold transition ${
                      path === key ? "bg-ink text-paper shadow-sm" : "text-muted hover:text-ink"
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <NumberField
                label="Average nightly rate (ADR)"
                prefix="£"
                value={adr}
                min={CONFIG.adr.min}
                max={CONFIG.adr.max}
                step={CONFIG.adr.step}
                onChange={setAdr}
              />

              {path === "A" ? (
                <NumberField
                  label="Monthly room nights sold"
                  value={monthlyRoomNights}
                  min={CONFIG.monthlyRoomNights.min}
                  max={CONFIG.monthlyRoomNights.max}
                  step={CONFIG.monthlyRoomNights.step}
                  onChange={setMonthlyRoomNights}
                />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <NumberField
                    label="Number of rooms"
                    value={rooms}
                    min={CONFIG.rooms.min}
                    max={CONFIG.rooms.max}
                    step={CONFIG.rooms.step}
                    onChange={setRooms}
                  />
                  <NumberField
                    label="Occupancy"
                    suffix="%"
                    value={occupancy}
                    min={CONFIG.occupancy.min}
                    max={CONFIG.occupancy.max}
                    step={CONFIG.occupancy.step}
                    source={CONFIG.occupancy.source}
                    onChange={setOccupancy}
                  />
                </div>
              )}

              <SliderRow
                label="Bookings via OTAs"
                value={otaShare}
                min={CONFIG.otaShare.min}
                max={CONFIG.otaShare.max}
                step={CONFIG.otaShare.step}
                display={percent(otaShare)}
                source={CONFIG.otaShare.source}
                onChange={setOtaShare}
              />
              <SliderRow
                label="Average OTA commission"
                value={commission}
                min={CONFIG.commission.min}
                max={CONFIG.commission.max}
                step={CONFIG.commission.step}
                display={percent(commission)}
                source={CONFIG.commission.source}
                onChange={setCommission}
              />
              <SliderRow
                label="Bookings you could move direct"
                value={targetShift}
                min={CONFIG.targetShift.min}
                max={CONFIG.targetShift.max}
                step={CONFIG.targetShift.step}
                display={percent(targetShift)}
                source={CONFIG.targetShift.source}
                onChange={setTargetShift}
              />
            </div>

            {/* Advanced */}
            <div className="mt-6 border-t border-sage/50 pt-4">
              <button
                type="button"
                aria-expanded={advancedOpen}
                onClick={() => setAdvancedOpen((v) => !v)}
                className="focus-ring flex w-full items-center justify-between rounded-lg text-left text-[14px] font-semibold text-ink"
              >
                Advanced: direct booking cost of sale
                <span aria-hidden className="text-muted">{advancedOpen ? "–" : "+"}</span>
              </button>
              {advancedOpen && (
                <div className="mt-4">
                  <SliderRow
                    label="Direct booking cost of sale"
                    value={directCostOfSale}
                    min={CONFIG.directCostOfSale.min}
                    max={CONFIG.directCostOfSale.max}
                    step={CONFIG.directCostOfSale.step}
                    display={percent(directCostOfSale)}
                    source={CONFIG.directCostOfSale.source}
                    onChange={setDirectCostOfSale}
                  />
                  <p className="mt-2 text-[13px] leading-snug text-muted">
                    What it costs you to win a booking direct (website, payments, marketing). Direct
                    only pays off below your OTA commission rate.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Result panel */}
          <div className="lg:sticky lg:top-6">
            <div className="rounded-2xl border border-sage/50 bg-mist/50 p-6 shadow-card sm:p-8">
              <Results result={result} targetShift={targetShift} />
            </div>
          </div>
        </div>

        {/* Lead capture */}
        <div className="mx-auto mt-6 max-w-3xl lg:mt-8">
          <EmailGate inputs={inputs} result={liveResult} />
        </div>

        {/* Footer note */}
        <p className="mx-auto mt-8 max-w-3xl text-center text-[12.5px] leading-relaxed text-muted/80">
          Estimates based on the figures you enter and published industry benchmarks. Your actual
          numbers will vary. Current OTA commission of {percent(commission)} on {money(result.otaRevenue)}{" "}
          of OTA revenue is used to model the recovery above.
        </p>
      </section>
    </div>
  );
}

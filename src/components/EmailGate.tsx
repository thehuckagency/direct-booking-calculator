import { useState } from "react";
import { BOOKING_URL, LEAD_WEBHOOK_URL, PRIVACY_POLICY_URL } from "../config";
import type { RecoveryInputs, RecoveryResult } from "../lib/calculateRecovery";

export interface LeadPayload {
  // Contact
  email: string;
  hotelName: string;
  name: string;
  consent: boolean;
  // Inputs (flat)
  revenuePath: "A" | "B";
  adr: number;
  monthlyRoomNights: number;
  rooms: number;
  occupancy: number;
  otaSharePct: number;
  commissionPct: number;
  targetShiftPct: number;
  directCostOfSalePct: number;
  // Outputs (flat)
  annualRoomRevenue: number;
  otaRevenue: number;
  currentCommissionCost: number;
  netAnnualRecovery: number;
  monthlyRecovery: number;
  threeYearRecovery: number;
  // Meta
  source: string;
  submittedAt: string;
}

function buildPayload(
  inputs: RecoveryInputs,
  result: RecoveryResult,
  contact: { email: string; hotelName: string; name: string; consent: boolean },
): LeadPayload {
  return {
    email: contact.email.trim(),
    hotelName: contact.hotelName.trim(),
    name: contact.name.trim(),
    consent: contact.consent,
    revenuePath: inputs.path,
    adr: inputs.adr,
    monthlyRoomNights: result.monthlyRoomNights,
    rooms: inputs.rooms,
    occupancy: inputs.occupancy,
    otaSharePct: inputs.otaShare,
    commissionPct: inputs.commission,
    targetShiftPct: inputs.targetShift,
    directCostOfSalePct: inputs.directCostOfSale,
    annualRoomRevenue: result.annualRoomRevenue,
    otaRevenue: result.otaRevenue,
    currentCommissionCost: result.currentCommissionCost,
    netAnnualRecovery: result.netAnnualRecovery,
    monthlyRecovery: result.monthlyRecovery,
    threeYearRecovery: result.threeYearRecovery,
    source: "direct-booking-recovery-calculator",
    submittedAt: new Date().toISOString(),
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailGate({
  inputs,
  result,
}: {
  inputs: RecoveryInputs;
  result: RecoveryResult;
}) {
  const [email, setEmail] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError("Please enter a valid work email so we can send your report.");
      return;
    }
    if (!consent) {
      setError("Please tick the consent box so we can send your report.");
      return;
    }

    const payload = buildPayload(inputs, result, { email, hotelName, name, consent });
    setStatus("sending");
    try {
      if (LEAD_WEBHOOK_URL) {
        const res = await fetch(LEAD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
      } else {
        // No webhook configured (e.g. local preview): surface the payload.
        // eslint-disable-next-line no-console
        console.info("[lead capture] no LEAD_WEBHOOK_URL set — payload:", payload);
      }
      setStatus("done");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[lead capture] failed:", err);
      setError("Something went wrong sending your report. Please try again in a moment.");
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-gain/30 bg-surface p-6 text-center sm:p-8">
        <p className="font-display text-[26px] font-semibold leading-tight text-ink">
          Your report is on its way
        </p>
        <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-muted">
          Check your inbox for your numbers and a simple three-step plan. Want to talk it through?
        </p>
        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring mt-5 inline-flex items-center justify-center rounded-full bg-ink px-7 py-4 text-[15.5px] font-semibold text-paper transition hover:bg-gain"
        >
          Book a free 20-minute direct booking review with Huck
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="rounded-2xl border border-sage/60 bg-surface p-6 sm:p-8"
    >
      <h3 className="font-display text-[24px] font-semibold leading-tight text-ink">
        Want the full breakdown?
      </h3>
      <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted">
        We will send you a clear one-page report with your numbers and a simple three-step plan to
        start winning bookings back direct. Just tell us where to send it.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="lead-email" className="sr-only">
            Work email
          </label>
          <input
            id="lead-email"
            type="email"
            required
            autoComplete="email"
            placeholder="Work email"
            className="field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="mt-2 text-[13px] leading-snug text-muted">
            No spam, no sales pressure. Just your numbers and a plan you can act on.
          </p>
        </div>
        <div>
          <label htmlFor="lead-hotel" className="sr-only">
            Hotel name (optional)
          </label>
          <input
            id="lead-hotel"
            type="text"
            autoComplete="organization"
            placeholder="Hotel name (optional)"
            className="field"
            value={hotelName}
            onChange={(e) => setHotelName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="lead-name" className="sr-only">
            Your name (optional)
          </label>
          <input
            id="lead-name"
            type="text"
            autoComplete="name"
            placeholder="Your name (optional)"
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-3 text-[13.5px] leading-snug text-muted">
        <input
          type="checkbox"
          className="focus-ring mt-0.5 h-[18px] w-[18px] shrink-0 rounded border-sage accent-ink"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          I agree to Huck contacting me about my results and storing my details per the{" "}
          <a
            href={PRIVACY_POLICY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-ink underline underline-offset-2 hover:text-gain"
          >
            privacy policy
          </a>
          .
        </span>
      </label>

      {error && (
        <p role="alert" className="mt-3 text-[13.5px] font-medium text-ink">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="focus-ring mt-5 inline-flex w-full items-center justify-center rounded-full bg-ink px-7 py-4 text-[15.5px] font-semibold text-paper transition hover:bg-gain disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {status === "sending" ? "Sending..." : "Send me my recovery report"}
      </button>
    </form>
  );
}

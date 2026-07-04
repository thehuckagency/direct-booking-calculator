/**
 * CONFIG — every default, range and benchmark citation lives here.
 * Update these figures without touching any calculation logic.
 *
 * Sources are cited inline. All monetary values are GBP (£).
 */

export interface FieldConfig {
  default: number;
  min: number;
  max: number;
  /** Step used by sliders / number inputs. */
  step: number;
  /** Short provenance shown in the "?" tooltip. Empty string = no tooltip. */
  source: string;
}

export const CONFIG = {
  // ----- Room revenue inputs -----
  adr: {
    default: 120,
    min: 10,
    max: 2000,
    step: 1,
    source: "", // property-specific, no benchmark
  } as FieldConfig,

  // Path A — monthly room nights sold directly
  monthlyRoomNights: {
    default: 600,
    min: 1,
    max: 200000,
    step: 1,
    source: "", // property-specific
  } as FieldConfig,

  // Path B — rooms + occupancy
  rooms: {
    default: 40,
    min: 1,
    max: 2000,
    step: 1,
    source: "", // property-specific
  } as FieldConfig,
  occupancy: {
    default: 70,
    min: 1,
    max: 100,
    step: 1,
    source: "UK hotel occupancy averaged roughly 70% through 2025 (property-specific in practice).",
  } as FieldConfig,

  // ----- Distribution inputs -----
  otaShare: {
    default: 40,
    min: 0,
    max: 100,
    step: 1,
    source:
      "Independents average roughly 35–63% of bookings via OTAs. Source: hotelsseo.com direct-booking-vs-ota statistics.",
  } as FieldConfig,

  commission: {
    default: 17.5,
    min: 5,
    max: 35,
    step: 0.5,
    source:
      "Booking.com 2026 average commission ~17.5%. 15–25% is typical, above 25% with preferred programmes. Sources: bookingwhizz.com hotel-distribution-trends-2026, rategain.com hotel-direct-booking-vs-ota.",
  } as FieldConfig,

  targetShift: {
    default: 15,
    min: 5,
    max: 50,
    step: 1,
    source:
      "A conservative, credible share of OTA bookings to move direct. Many properties push well beyond this.",
  } as FieldConfig,

  // ----- Advanced (collapsed by default) -----
  directCostOfSale: {
    default: 5,
    min: 0,
    max: 15,
    step: 0.5,
    source:
      "The real cost of a direct booking (website, payments, marketing) is typically 4–7%. Sources: arcconsulting.io true-cost-direct-hotel-booking, hospitalitynet.org independent-hoteliers-playbook.",
  } as FieldConfig,

  // ----- Constants -----
  daysPerMonth: 30.4,

  // Currency + locale
  currency: "GBP" as const,
  locale: "en-GB" as const,
} as const;

/**
 * Webhook the captured lead is POSTed to. Wire this to your CRM / the
 * lead-nurture backend. Reads an env var first so it can be set per deploy,
 * then falls back to this constant. Leave blank to log the payload to the
 * console instead of sending (useful in preview).
 */
export const LEAD_WEBHOOK_URL: string =
  (import.meta.env.VITE_LEAD_WEBHOOK_URL as string | undefined) ?? "";

/** Where the post-capture "Book a review" button links. */
export const BOOKING_URL: string =
  (import.meta.env.VITE_BOOKING_URL as string | undefined) ??
  "https://huck.agency/book";

/** Privacy policy link used by the GDPR consent checkbox. */
export const PRIVACY_POLICY_URL: string =
  (import.meta.env.VITE_PRIVACY_URL as string | undefined) ??
  "https://huck.agency/privacy";

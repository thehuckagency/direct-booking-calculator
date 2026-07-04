import { CONFIG } from "../config";

export type RevenuePath = "A" | "B";

export interface RecoveryInputs {
  /** "A" = enter monthly room nights directly; "B" = derive from rooms + occupancy. */
  path: RevenuePath;
  /** Average nightly rate (ADR), £. */
  adr: number;
  /** Path A: monthly room nights sold. */
  monthlyRoomNights: number;
  /** Path B: number of rooms. */
  rooms: number;
  /** Path B: occupancy rate, %. */
  occupancy: number;
  /** Share of bookings via OTAs, %. */
  otaShare: number;
  /** Average OTA commission, %. */
  commission: number;
  /** Target share of OTA bookings to move direct, %. */
  targetShift: number;
  /** Cost of sale on a direct booking, %. */
  directCostOfSale: number;
}

export interface RecoveryResult {
  // Resolved / clamped inputs actually used
  monthlyRoomNights: number;
  monthlyRoomRevenue: number;
  annualRoomRevenue: number;
  otaRevenue: number;
  /** Annual £ paid to OTAs in commission right now. */
  currentCommissionCost: number;
  revenueShifted: number;
  commissionSaved: number;
  directCostIncurred: number;
  /** HEADLINE: net annual £ recovered by shifting bookings direct. */
  netAnnualRecovery: number;
  /** netAnnualRecovery / 12. */
  monthlyRecovery: number;
  /** netAnnualRecovery * 3. */
  threeYearRecovery: number;
  /**
   * True when the modelled direct cost of sale meets or exceeds the OTA
   * commission, so shifting saves nothing. netAnnualRecovery is floored at £0.
   */
  directCostExceedsCommission: boolean;
}

/** Clamp v into [min, max]; coerce anything non-finite (NaN, undefined) to min. */
function clamp(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.min(Math.max(v, min), max);
}

/** Guard a raw numeric input: empty / NaN becomes 0, never propagates NaN. */
function num(v: number): number {
  return Number.isFinite(v) ? v : 0;
}

/**
 * Pure, side-effect-free revenue recovery model.
 *
 * Every branch is deterministic and NaN-safe: empty or zero inputs yield £0,
 * never NaN. Currency outputs are rounded to the nearest £. Recovery is never
 * negative — if direct cost of sale >= commission, the headline is floored to
 * £0 and `directCostExceedsCommission` is set.
 */
export function calculateRecovery(inputs: RecoveryInputs): RecoveryResult {
  const adr = clamp(num(inputs.adr), 0, CONFIG.adr.max);
  const otaShare = clamp(num(inputs.otaShare), 0, 100);
  const commission = clamp(num(inputs.commission), 0, 100);
  const targetShift = clamp(num(inputs.targetShift), 0, 100);
  const directCostOfSale = clamp(num(inputs.directCostOfSale), 0, 100);

  // Two paths to monthly room nights.
  let monthlyRoomNights: number;
  if (inputs.path === "B") {
    const rooms = clamp(num(inputs.rooms), 0, CONFIG.rooms.max);
    const occupancy = clamp(num(inputs.occupancy), 0, 100);
    monthlyRoomNights = rooms * CONFIG.daysPerMonth * (occupancy / 100);
  } else {
    monthlyRoomNights = clamp(num(inputs.monthlyRoomNights), 0, CONFIG.monthlyRoomNights.max);
  }

  const monthlyRoomRevenue = adr * monthlyRoomNights;
  const annualRoomRevenue = monthlyRoomRevenue * 12;
  const otaRevenue = annualRoomRevenue * (otaShare / 100);
  const currentCommissionCost = otaRevenue * (commission / 100);

  const revenueShifted = otaRevenue * (targetShift / 100);
  const commissionSaved = revenueShifted * (commission / 100);
  const directCostIncurred = revenueShifted * (directCostOfSale / 100);

  const rawNet = commissionSaved - directCostIncurred;
  const directCostExceedsCommission = directCostOfSale >= commission && revenueShifted > 0;
  const netAnnualRecovery = Math.max(0, rawNet);

  const round = (n: number) => Math.round(n);

  return {
    monthlyRoomNights: Math.round(monthlyRoomNights),
    monthlyRoomRevenue: round(monthlyRoomRevenue),
    annualRoomRevenue: round(annualRoomRevenue),
    otaRevenue: round(otaRevenue),
    currentCommissionCost: round(currentCommissionCost),
    revenueShifted: round(revenueShifted),
    commissionSaved: round(commissionSaved),
    directCostIncurred: round(directCostIncurred),
    netAnnualRecovery: round(netAnnualRecovery),
    monthlyRecovery: round(netAnnualRecovery / 12),
    threeYearRecovery: round(netAnnualRecovery * 3),
    directCostExceedsCommission,
  };
}

import { describe, it, expect } from "vitest";
import { calculateRecovery, type RecoveryInputs } from "./calculateRecovery";

const base: RecoveryInputs = {
  path: "A",
  adr: 120,
  monthlyRoomNights: 600,
  rooms: 40,
  occupancy: 70,
  otaShare: 40,
  commission: 17.5,
  targetShift: 15,
  directCostOfSale: 5,
};

describe("calculateRecovery", () => {
  it("computes the default scenario correctly (Path A)", () => {
    const r = calculateRecovery(base);
    // annual room revenue = 120 * 600 * 12 = 864,000
    expect(r.annualRoomRevenue).toBe(864000);
    // ota revenue = 864,000 * 40% = 345,600
    expect(r.otaRevenue).toBe(345600);
    // current commission = 345,600 * 17.5% = 60,480
    expect(r.currentCommissionCost).toBe(60480);
    // revenue shifted = 345,600 * 15% = 51,840
    expect(r.revenueShifted).toBe(51840);
    // commission saved = 51,840 * 17.5% = 9,072
    expect(r.commissionSaved).toBe(9072);
    // direct cost incurred = 51,840 * 5% = 2,592
    expect(r.directCostIncurred).toBe(2592);
    // net recovery = 9,072 - 2,592 = 6,480
    expect(r.netAnnualRecovery).toBe(6480);
    expect(r.monthlyRecovery).toBe(540);
    expect(r.threeYearRecovery).toBe(19440);
    expect(r.directCostExceedsCommission).toBe(false);
  });

  it("Path B derives room nights from rooms * 30.4 * occupancy", () => {
    const r = calculateRecovery({ ...base, path: "B", rooms: 40, occupancy: 70 });
    // 40 * 30.4 * 0.70 = 851.2 -> rounded display 851
    expect(r.monthlyRoomNights).toBe(851);
    // revenue uses the unrounded night count: 120 * 851.2 * 12 = 1,225,728
    expect(r.annualRoomRevenue).toBe(1225728);
  });

  it("never returns NaN for empty / zero inputs", () => {
    const r = calculateRecovery({
      ...base,
      adr: NaN,
      monthlyRoomNights: NaN,
      otaShare: NaN,
      commission: NaN,
      targetShift: NaN,
      directCostOfSale: NaN,
    });
    Object.values(r).forEach((v) => {
      if (typeof v === "number") expect(Number.isNaN(v)).toBe(false);
    });
    expect(r.netAnnualRecovery).toBe(0);
  });

  it("floors recovery at £0 and flags when direct cost >= commission", () => {
    const r = calculateRecovery({ ...base, commission: 8, directCostOfSale: 10 });
    expect(r.netAnnualRecovery).toBe(0);
    expect(r.directCostExceedsCommission).toBe(true);
  });

  it("clamps out-of-range inputs to their bounds", () => {
    const over = calculateRecovery({ ...base, otaShare: 250, commission: 999, targetShift: 500 });
    // otaShare clamps to 100, commission to 100, targetShift to 100
    // otaRevenue = 864,000 * 100% = 864,000
    expect(over.otaRevenue).toBe(864000);
    const under = calculateRecovery({ ...base, adr: -50, otaShare: -10 });
    expect(under.otaRevenue).toBe(0);
    expect(under.netAnnualRecovery).toBe(0);
  });

  it("rounds all currency outputs to the nearest £", () => {
    const r = calculateRecovery({ ...base, adr: 133, monthlyRoomNights: 517, commission: 16.3 });
    Object.entries(r).forEach(([k, v]) => {
      if (typeof v === "number" && k !== "directCostExceedsCommission") {
        expect(Number.isInteger(v)).toBe(true);
      }
    });
  });
});

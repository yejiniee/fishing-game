import { describe, expect, it } from "vitest";
import { TITLE_TIERS, nextTitleGap, titleForCatches } from "../titles";

describe("titleForCatches", () => {
  it("gives the burnout-boss title to anyone with 40 catches or fewer", () => {
    expect(titleForCatches(0)).toBe("방어잡다 번아웃 온 사장님");
    expect(titleForCatches(40)).toBe("방어잡다 번아웃 온 사장님");
    expect(titleForCatches(41)).not.toBe("방어잡다 번아웃 온 사장님");
  });

  it("has exactly four tiers in 40-catch intervals", () => {
    expect(TITLE_TIERS).toHaveLength(4);
    expect(TITLE_TIERS.map((tier) => tier.minCatches)).toEqual([0, 41, 81, 121]);
  });

  it("upgrades exactly at each tier threshold", () => {
    for (const tier of TITLE_TIERS) {
      expect(titleForCatches(tier.minCatches)).toBe(tier.title);
      if (tier.minCatches > 0) {
        expect(titleForCatches(tier.minCatches - 1)).not.toBe(tier.title);
      }
    }
  });

  it("keeps the highest tier for very large catch counts", () => {
    const highest = TITLE_TIERS[TITLE_TIERS.length - 1];
    expect(titleForCatches(100000)).toBe(highest.title);
  });
});

describe("nextTitleGap", () => {
  it("reports how many more catches are needed for the next tier", () => {
    const gap = nextTitleGap(5);
    expect(gap).not.toBeNull();
    expect(gap?.remaining).toBe(TITLE_TIERS[1].minCatches - 5);
    expect(gap?.title).toBe(TITLE_TIERS[1].title);
  });

  it("returns null once the highest tier is reached", () => {
    const highest = TITLE_TIERS[TITLE_TIERS.length - 1];
    expect(nextTitleGap(highest.minCatches)).toBeNull();
  });
});

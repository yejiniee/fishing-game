import { describe, expect, it } from "vitest";
import {
  dwellMsFor,
  jumpMsFor,
  stageForCatches,
  pickPosition,
  pickFishSize,
  pickCreatureKind,
  pickFishExpression,
  distance,
  DIFFICULTY_STAGES,
  FISH_EXPRESSIONS,
  FISH_SIZES,
  MIN_FISH_GAP,
  MIN_JUMP_DISTANCE,
  STAGE_PADDING,
} from "../fishGame";

describe("stageForCatches", () => {
  it("starts at the first stage when no fish have been caught", () => {
    expect(stageForCatches(0)).toBe(DIFFICULTY_STAGES[0]);
  });

  it("advances to the next stage once its threshold is reached", () => {
    const secondStage = DIFFICULTY_STAGES[1];
    expect(stageForCatches(secondStage.minCatches)).toBe(secondStage);
    expect(stageForCatches(secondStage.minCatches - 1)).not.toBe(secondStage);
  });

  it("spawns more fish at once as the stages progress (progressive difficulty)", () => {
    const counts = DIFFICULTY_STAGES.map((s) => s.fishCount);
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i]).toBeGreaterThanOrEqual(counts[i - 1]);
    }
    expect(counts[counts.length - 1]).toBeGreaterThan(counts[0]);
  });
});

describe("dwellMsFor", () => {
  it("matches the first stage's base dwell time at catchCount 0", () => {
    expect(dwellMsFor(0, "medium")).toBe(DIFFICULTY_STAGES[0].dwellBase);
  });

  it("shrinks within a stage as more fish are caught", () => {
    expect(dwellMsFor(5, "medium")).toBeLessThan(dwellMsFor(0, "medium"));
  });

  it("never drops below the current (final) stage's floor, however high the catch count", () => {
    const finalStage = DIFFICULTY_STAGES[DIFFICULTY_STAGES.length - 1];
    expect(dwellMsFor(1000, "medium")).toBe(finalStage.dwellFloor);
  });

  it("keeps getting harder across stage boundaries overall", () => {
    expect(dwellMsFor(90, "medium")).toBeLessThan(dwellMsFor(0, "medium"));
  });

  it("small fish have a shorter dwell time than large fish at the same catch count", () => {
    expect(dwellMsFor(0, "small")).toBeLessThan(dwellMsFor(0, "large"));
  });
});

describe("jumpMsFor", () => {
  it("gets faster (shorter) in later stages", () => {
    expect(jumpMsFor(90)).toBeLessThan(jumpMsFor(0));
  });
});

describe("pickFishSize", () => {
  it("always returns a known size tier", () => {
    for (let i = 0; i <= 10; i++) {
      const size = pickFishSize(() => i / 10);
      expect(Object.keys(FISH_SIZES)).toContain(size);
    }
  });
});

describe("pickCreatureKind", () => {
  it("always returns a known creature kind", () => {
    for (let i = 0; i <= 10; i++) {
      const kind = pickCreatureKind(() => i / 10);
      expect(["yellowtail", "pufferfish", "squid"]).toContain(kind);
    }
  });

  it("yellowtail is the most common kind (weighted majority)", () => {
    let yellowtailCount = 0;
    const trials = 2000;
    for (let i = 0; i < trials; i++) {
      if (pickCreatureKind(() => i / trials) === "yellowtail") yellowtailCount++;
    }
    expect(yellowtailCount / trials).toBeGreaterThan(0.5);
  });

  it("decoys (pufferfish/squid) still appear often enough to matter", () => {
    const kinds = new Set<string>();
    for (let i = 0; i < 100; i++) kinds.add(pickCreatureKind(() => i / 100));
    expect(kinds.has("pufferfish")).toBe(true);
    expect(kinds.has("squid")).toBe(true);
  });
});

describe("pickFishExpression", () => {
  it("always returns a known expression", () => {
    for (let i = 0; i < FISH_EXPRESSIONS.length; i++) {
      const expression = pickFishExpression(() => i / FISH_EXPRESSIONS.length);
      expect(FISH_EXPRESSIONS).toContain(expression);
    }
  });
});

describe("pickPosition", () => {
  it("stays within the padded stage bounds", () => {
    const rng = () => 0.5;
    const pos = pickPosition([], rng);
    expect(pos.x).toBeGreaterThanOrEqual(STAGE_PADDING);
    expect(pos.x).toBeLessThanOrEqual(100 - STAGE_PADDING);
    expect(pos.y).toBeGreaterThanOrEqual(STAGE_PADDING);
    expect(pos.y).toBeLessThanOrEqual(100 - STAGE_PADDING);
  });

  it("respects a single avoid rule (own previous position)", () => {
    let seed = 0;
    const rng = () => {
      seed = (seed + 0.37) % 1;
      return seed;
    };
    const prev = { x: 20, y: 20 };
    for (let i = 0; i < 50; i++) {
      const next = pickPosition([{ position: prev, minDistance: MIN_JUMP_DISTANCE }], rng);
      expect(distance(prev, next)).toBeGreaterThanOrEqual(MIN_JUMP_DISTANCE - 0.01);
    }
  });

  it("respects multiple avoid rules at once (other active fish)", () => {
    let seed = 0.05;
    const rng = () => {
      seed = (seed + 0.29) % 1;
      return seed;
    };
    const rules = [
      { position: { x: 20, y: 20 }, minDistance: MIN_JUMP_DISTANCE },
      { position: { x: 70, y: 70 }, minDistance: MIN_FISH_GAP },
      { position: { x: 30, y: 75 }, minDistance: MIN_FISH_GAP },
    ];
    const next = pickPosition(rules, rng);
    for (const rule of rules) {
      expect(distance(rule.position, next)).toBeGreaterThanOrEqual(rule.minDistance - 0.01);
    }
  });

  it("falls back to the best-effort candidate when no position satisfies every rule", () => {
    const rules = [{ position: { x: 50, y: 50 }, minDistance: 200 }];
    const next = pickPosition(rules, () => 0.5);
    expect(next.x).toBeGreaterThanOrEqual(STAGE_PADDING);
    expect(next.x).toBeLessThanOrEqual(100 - STAGE_PADDING);
  });
});

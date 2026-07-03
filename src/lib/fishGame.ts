import type { CreatureKind, FishExpression, FishSize, Position } from "../types/fish";

export const INITIAL_LIVES = 5;

// 스테이지 가장자리에서 물고기가 잘리지 않도록 두는 여백(%)
export const STAGE_PADDING = 14;

// 같은 물고기의 다음 점프 위치는 이전 위치에서 이 거리(%) 이상 떨어져야 한다.
export const MIN_JUMP_DISTANCE = 32;

// 서로 다른 물고기끼리는 이 거리(%) 이상 떨어뜨려 겹치지 않게 한다.
export const MIN_FISH_GAP = 24;

// 잡힌 후 다음 위치로 넘어가기 전 대기시간
export const CATCH_DELAY_MS = 320;

// 크기별 특성 — 작을수록 화면 표시/판정 영역이 작아 잡기 어려운 대신 점수가 높고,
// 그라운드 지속시간도 짧아 더 다급하게 움직인다.
export const FISH_SIZES: Record<FishSize, { scale: number; points: number; dwellMultiplier: number }> = {
  large: { scale: 1.35, points: 1, dwellMultiplier: 1.2 },
  medium: { scale: 1, points: 2, dwellMultiplier: 1 },
  small: { scale: 0.7, points: 3, dwellMultiplier: 0.82 },
};

const FISH_SIZE_WEIGHTS: readonly (readonly [FishSize, number])[] = [
  ["large", 0.3],
  ["medium", 0.4],
  ["small", 0.3],
];

export function pickFishSize(rng: () => number = Math.random): FishSize {
  const roll = rng();
  let cumulative = 0;
  for (const [size, weight] of FISH_SIZE_WEIGHTS) {
    cumulative += weight;
    if (roll < cumulative) return size;
  }
  return FISH_SIZE_WEIGHTS[FISH_SIZE_WEIGHTS.length - 1][0];
}

// 등장 생물 종류 — 방어는 잡아야 할 진짜 목표, 복어/오징어는 잡으면 목숨이 깎이는 미끼다.
// 방어끼리 헷갈리지 않도록 방어는 항상 같은 색으로 고정하고(색 변주 없음), 종(shape)으로만 구분한다.
const CREATURE_KIND_WEIGHTS: readonly (readonly [CreatureKind, number])[] = [
  ["yellowtail", 0.68],
  ["pufferfish", 0.18],
  ["squid", 0.14],
];

export function pickCreatureKind(rng: () => number = Math.random): CreatureKind {
  const roll = rng();
  let cumulative = 0;
  for (const [kind, weight] of CREATURE_KIND_WEIGHTS) {
    cumulative += weight;
    if (roll < cumulative) return kind;
  }
  return CREATURE_KIND_WEIGHTS[CREATURE_KIND_WEIGHTS.length - 1][0];
}

export const FISH_EXPRESSIONS: readonly FishExpression[] = ["normal", "happy", "surprised", "sleepy"];

export function pickFishExpression(rng: () => number = Math.random): FishExpression {
  const index = Math.min(FISH_EXPRESSIONS.length - 1, Math.floor(rng() * FISH_EXPRESSIONS.length));
  return FISH_EXPRESSIONS[index];
}

// 난이도 스테이지 — 잡은 마릿수(catchCount)가 임계값을 넘을 때마다 동시 등장 마릿수가
// 늘고, 그라운드/점프 시간도 짧아진다. 스테이지 안에서도 잡을수록 점점 더 빨라진다.
export interface DifficultyStage {
  minCatches: number;
  fishCount: number;
  dwellBase: number;
  dwellFloor: number;
  dwellStep: number;
  jumpDurationMs: number;
}

export const DIFFICULTY_STAGES: readonly DifficultyStage[] = [
  { minCatches: 0, fishCount: 3, dwellBase: 1650, dwellFloor: 520, dwellStep: 50, jumpDurationMs: 420 },
  { minCatches: 8, fishCount: 4, dwellBase: 1500, dwellFloor: 460, dwellStep: 55, jumpDurationMs: 380 },
  { minCatches: 20, fishCount: 4, dwellBase: 1300, dwellFloor: 400, dwellStep: 60, jumpDurationMs: 340 },
  { minCatches: 40, fishCount: 5, dwellBase: 1150, dwellFloor: 360, dwellStep: 65, jumpDurationMs: 300 },
  { minCatches: 70, fishCount: 5, dwellBase: 1000, dwellFloor: 320, dwellStep: 70, jumpDurationMs: 260 },
];

export function stageForCatches(catchCount: number): DifficultyStage {
  let stage = DIFFICULTY_STAGES[0];
  for (const candidate of DIFFICULTY_STAGES) {
    if (catchCount >= candidate.minCatches) stage = candidate;
  }
  return stage;
}

// 현재 스테이지 기준으로 그라운드(잡을 수 있는) 지속시간을 계산한다.
// 스테이지에 진입한 뒤로 잡을수록 dwellFloor까지 계속 짧아진다.
export function dwellMsFor(catchCount: number, size: FishSize): number {
  const stage = stageForCatches(catchCount);
  const raw = stage.dwellBase - (catchCount - stage.minCatches) * stage.dwellStep;
  return Math.max(stage.dwellFloor, raw) * FISH_SIZES[size].dwellMultiplier;
}

export function jumpMsFor(catchCount: number): number {
  return stageForCatches(catchCount).jumpDurationMs;
}

export function distance(a: Position, b: Position): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export interface AvoidRule {
  position: Position;
  minDistance: number;
}

// rules를 모두 만족하는(=각 기준 위치에서 minDistance 이상 떨어진) 좌표를 찾는다.
// 못 찾으면 각 기준까지의 여유 거리 합이 가장 큰 후보로 최선을 다해 타협한다.
export function pickPosition(rules: readonly AvoidRule[], rng: () => number = Math.random): Position {
  const span = 100 - STAGE_PADDING * 2;
  const sample = (): Position => ({
    x: STAGE_PADDING + rng() * span,
    y: STAGE_PADDING + rng() * span,
  });

  for (let attempt = 0; attempt < 30; attempt++) {
    const candidate = sample();
    if (rules.every((rule) => distance(rule.position, candidate) >= rule.minDistance)) return candidate;
  }

  let best = sample();
  let bestMargin = -Infinity;
  for (let attempt = 0; attempt < 12; attempt++) {
    const candidate = sample();
    const margin = rules.length
      ? Math.min(...rules.map((rule) => distance(rule.position, candidate) - rule.minDistance))
      : 0;
    if (margin > bestMargin) {
      bestMargin = margin;
      best = candidate;
    }
  }
  return best;
}

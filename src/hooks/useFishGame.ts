import { useCallback, useEffect, useRef, useState } from "react";
import type { Feedback, FishEntity, GamePhase } from "../types/fish";
import {
  CATCH_DELAY_MS,
  FISH_SIZES,
  INITIAL_LIVES,
  MIN_FISH_GAP,
  MIN_JUMP_DISTANCE,
  dwellMsFor,
  jumpMsFor,
  pickCreatureKind,
  pickFishExpression,
  pickFishSize,
  pickPosition,
  stageForCatches,
} from "../lib/fishGame";
import { pickRandom } from "../lib/random";
import { CATCH_MESSAGES, ESCAPE_MESSAGES, PENALTY_MESSAGES } from "../constants/messages";

const BEST_SCORE_KEY = "bangeo-jabgi:best-score";

function readBestScore(): number {
  try {
    return Number(localStorage.getItem(BEST_SCORE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeBestScore(value: number) {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(value));
  } catch {
    // localStorage 접근 불가 환경은 최고점 저장을 건너뛴다.
  }
}

interface GameState {
  phase: GamePhase;
  fish: FishEntity[];
  score: number;
  catchCount: number;
  best: number;
  lives: number;
  combo: number;
  feedback: Feedback | null;
}

let nextFishId = 0;

function spawnFish(avoid: { position: FishEntity["position"]; minDistance: number }[]): FishEntity {
  return {
    id: ++nextFishId,
    phase: "grounded",
    position: pickPosition(avoid),
    kind: pickCreatureKind(),
    size: pickFishSize(),
    expression: pickFishExpression(),
    round: 0,
  };
}

function spawnFishList(count: number): FishEntity[] {
  const fish: FishEntity[] = [];
  for (let i = 0; i < count; i++) {
    fish.push(spawnFish(fish.map((f) => ({ position: f.position, minDistance: MIN_FISH_GAP }))));
  }
  return fish;
}

// 같은 개체를 다른 자리·다른 크기/종/표정으로 다시 등장시킨다 (점프 애니메이션으로 이어짐).
function rerollEntity(entity: FishEntity, allFish: FishEntity[]): FishEntity {
  const others = allFish.filter((f) => f.id !== entity.id && f.phase !== "caught").map((f) => f.position);
  const rules = [
    { position: entity.position, minDistance: MIN_JUMP_DISTANCE },
    ...others.map((position) => ({ position, minDistance: MIN_FISH_GAP })),
  ];
  return {
    ...entity,
    phase: "jumping",
    position: pickPosition(rules),
    kind: pickCreatureKind(),
    size: pickFishSize(),
    expression: pickFishExpression(),
    round: entity.round + 1,
  };
}

function idleState(best: number): GameState {
  return {
    phase: "ready",
    fish: spawnFishList(stageForCatches(0).fishCount),
    score: 0,
    catchCount: 0,
    best,
    lives: INITIAL_LIVES,
    combo: 0,
    feedback: null,
  };
}

export function useFishGame() {
  const [game, setGame] = useState<GameState>(() => idleState(readBestScore()));
  const gameRef = useRef(game);
  gameRef.current = game;

  const feedbackIdRef = useRef(0);
  const timersRef = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const genRef = useRef(0);

  function clearTimer(fishId: number) {
    const timer = timersRef.current.get(fishId);
    if (timer) clearTimeout(timer);
    timersRef.current.delete(fishId);
  }

  function clearAllTimers() {
    for (const timer of timersRef.current.values()) clearTimeout(timer);
    timersRef.current.clear();
  }

  useEffect(() => clearAllTimers, []);

  function scheduleTimer(fishId: number, ms: number, fn: () => void) {
    clearTimer(fishId);
    timersRef.current.set(fishId, setTimeout(fn, ms));
  }

  function scheduleGrounded(fishId: number, gen: number) {
    const current = gameRef.current;
    const entity = current.fish.find((f) => f.id === fishId);
    if (!entity) return;
    const ms = dwellMsFor(current.catchCount, entity.size);
    scheduleTimer(fishId, ms, () => handleTimeout(fishId, gen));
  }

  function scheduleLand(fishId: number, gen: number) {
    scheduleTimer(fishId, jumpMsFor(gameRef.current.catchCount), () => handleLand(fishId, gen));
  }

  // 난이도 스테이지가 올라 동시 등장 마릿수가 늘었다면 부족한 만큼 새로 스폰한다.
  function ensureFishCount(gen: number) {
    const current = gameRef.current;
    const targetCount = stageForCatches(current.catchCount).fishCount;
    const missing = targetCount - current.fish.length;
    if (missing <= 0) return;

    const spawned: FishEntity[] = [];
    for (let i = 0; i < missing; i++) {
      const avoid = [...current.fish, ...spawned].map((f) => ({ position: f.position, minDistance: MIN_FISH_GAP }));
      spawned.push(spawnFish(avoid));
    }

    const nextState: GameState = { ...current, fish: [...current.fish, ...spawned] };
    gameRef.current = nextState;
    setGame(nextState);
    for (const entity of spawned) scheduleGrounded(entity.id, gen);
  }

  // 그라운드 상태로 시간을 다 흘려보냈을 때: 방어는 못 잡은 것이므로 목숨이 깎이지만,
  // 복어/오징어는 안 건드리는 게 정답이라 페널티 없이 조용히 다른 곳으로 이동한다.
  function handleTimeout(fishId: number, gen: number) {
    if (gen !== genRef.current) return;
    const current = gameRef.current;
    const entity = current.fish.find((f) => f.id === fishId);
    if (!entity || entity.phase !== "grounded") return;

    if (entity.kind !== "yellowtail") {
      const fish = current.fish.map((f) => (f.id === fishId ? rerollEntity(f, current.fish) : f));
      const nextState: GameState = { ...current, fish };
      gameRef.current = nextState;
      setGame(nextState);
      scheduleLand(fishId, gen);
      return;
    }

    feedbackIdRef.current += 1;
    const feedback: Feedback = {
      kind: "escape",
      message: pickRandom(ESCAPE_MESSAGES),
      position: entity.position,
      id: feedbackIdRef.current,
    };
    const lives = current.lives - 1;

    if (lives <= 0) {
      clearAllTimers();
      const nextState: GameState = { ...current, lives: 0, phase: "gameover", combo: 0, feedback };
      gameRef.current = nextState;
      setGame(nextState);
      return;
    }

    const fish = current.fish.map((f) => (f.id === fishId ? rerollEntity(f, current.fish) : f));
    const nextState: GameState = { ...current, lives, combo: 0, feedback, fish };
    gameRef.current = nextState;
    setGame(nextState);
    scheduleLand(fishId, gen);
  }

  function handleLand(fishId: number, gen: number) {
    if (gen !== genRef.current) return;
    const current = gameRef.current;
    const entity = current.fish.find((f) => f.id === fishId);
    if (!entity || entity.phase !== "jumping") return;
    const fish = current.fish.map((f) => (f.id === fishId ? { ...f, phase: "grounded" as const } : f));
    const nextState: GameState = { ...current, fish };
    gameRef.current = nextState;
    setGame(nextState);
    scheduleGrounded(fishId, gen);
  }

  function handleRespawn(fishId: number, gen: number) {
    if (gen !== genRef.current) return;
    const current = gameRef.current;
    const entity = current.fish.find((f) => f.id === fishId);
    if (!entity || entity.phase !== "caught") return;
    const fish = current.fish.map((f) => (f.id === fishId ? rerollEntity(f, current.fish) : f));
    const nextState: GameState = { ...current, fish };
    gameRef.current = nextState;
    setGame(nextState);
    scheduleLand(fishId, gen);
  }

  const catchFish = useCallback((fishId: number) => {
    const gen = genRef.current;
    const current = gameRef.current;
    if (current.phase !== "playing") return;
    const entity = current.fish.find((f) => f.id === fishId);
    if (!entity || entity.phase !== "grounded") return;

    feedbackIdRef.current += 1;

    // 진짜 방어를 잡은 경우 — 점수/마릿수 증가, 콤보 유지
    if (entity.kind === "yellowtail") {
      const points = FISH_SIZES[entity.size].points;
      const score = current.score + points;
      const catchCount = current.catchCount + 1;
      const best = Math.max(current.best, score);
      if (best !== current.best) writeBestScore(best);

      const feedback: Feedback = {
        kind: "catch",
        message: pickRandom(CATCH_MESSAGES),
        position: entity.position,
        id: feedbackIdRef.current,
        points,
      };
      const fish = current.fish.map((f) => (f.id === fishId ? { ...f, phase: "caught" as const } : f));
      const nextState: GameState = { ...current, score, catchCount, best, combo: current.combo + 1, feedback, fish };
      gameRef.current = nextState;
      setGame(nextState);
      scheduleTimer(fishId, CATCH_DELAY_MS, () => handleRespawn(fishId, gen));
      ensureFishCount(gen);
      return;
    }

    // 복어/오징어를 잘못 잡은 경우 — 목숨 차감, 콤보 초기화
    const lives = current.lives - 1;
    const feedback: Feedback = {
      kind: "penalty",
      message: pickRandom(PENALTY_MESSAGES),
      position: entity.position,
      id: feedbackIdRef.current,
    };

    if (lives <= 0) {
      clearAllTimers();
      const fish = current.fish.map((f) => (f.id === fishId ? { ...f, phase: "caught" as const } : f));
      const nextState: GameState = { ...current, lives: 0, phase: "gameover", combo: 0, feedback, fish };
      gameRef.current = nextState;
      setGame(nextState);
      return;
    }

    const fish = current.fish.map((f) => (f.id === fishId ? { ...f, phase: "caught" as const } : f));
    const nextState: GameState = { ...current, lives, combo: 0, feedback, fish };
    gameRef.current = nextState;
    setGame(nextState);
    scheduleTimer(fishId, CATCH_DELAY_MS, () => handleRespawn(fishId, gen));
  }, []);

  const start = useCallback(() => {
    clearAllTimers();
    genRef.current += 1;
    const gen = genRef.current;
    const fish = spawnFishList(stageForCatches(0).fishCount);
    const nextState: GameState = {
      phase: "playing",
      fish,
      score: 0,
      catchCount: 0,
      best: gameRef.current.best,
      lives: INITIAL_LIVES,
      combo: 0,
      feedback: null,
    };
    gameRef.current = nextState;
    setGame(nextState);
    for (const entity of fish) scheduleGrounded(entity.id, gen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...game, maxLives: INITIAL_LIVES, start, catchFish };
}

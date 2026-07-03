export type FishPhase = "grounded" | "jumping" | "caught";

export type GamePhase = "ready" | "playing" | "gameover";

export type FishSize = "small" | "medium" | "large";

export type FishExpression = "normal" | "happy" | "surprised" | "sleepy";

// 방어(잡아야 하는 진짜 목표)와 복어/오징어(잡으면 안 되는 미끼)
export type CreatureKind = "yellowtail" | "pufferfish" | "squid";

export interface Position {
  x: number;
  y: number;
}

export interface FishEntity {
  id: number;
  phase: FishPhase;
  position: Position;
  kind: CreatureKind;
  size: FishSize;
  expression: FishExpression;
  round: number; // 애니메이션 재시작 트리거용 (한 마리씩 독립적으로 증가)
}

export type FeedbackKind = "catch" | "escape" | "penalty";

export interface Feedback {
  kind: FeedbackKind;
  message: string;
  position: Position;
  id: number;
  points?: number; // catch일 때만 사용 — 실제로 얻은 점수
}

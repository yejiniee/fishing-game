// 전역 랭킹 관련 타입 (PRD §3.8, §5.4)

export interface RankingEntry {
  id: string;
  deviceId: string; // 기기별 UUID (localStorage)
  nickname: string; // 2~8자
  score: number;
  catchCount: number;
  createdAt: string;
}

// submitScore 입력값
export interface ScoreSubmission {
  nickname: string;
  score: number;
  catchCount: number;
}

// 전역 랭킹 API (PRD §5.4)
// 등록/갱신은 submit_score RPC로만 하고(타인 기록 훼손 방지), 조회는 scores 테이블 select.
import { supabase } from "./supabase";
import { getDeviceId } from "./deviceId";
import type { RankingEntry, ScoreSubmission } from "../types/ranking";

// DB(snake_case) 행 형태
interface ScoreRow {
  id: string;
  device_id: string;
  nickname: string;
  score: number;
  catch_count: number;
  created_at: string;
}

export function rowToEntry(row: ScoreRow): RankingEntry {
  return {
    id: row.id,
    deviceId: row.device_id,
    nickname: row.nickname,
    score: row.score,
    catchCount: row.catch_count,
    createdAt: row.created_at,
  };
}

// 내 기록 등록/갱신. device_id 기준 upsert(기존보다 나을 때만 갱신)는 RPC 안에서 처리한다.
// 랭킹이 비활성(env 미설정)이면 null을 반환한다.
export async function submitScore(submission: ScoreSubmission): Promise<RankingEntry | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("submit_score", {
    p_device_id: getDeviceId(),
    p_nickname: submission.nickname.trim(),
    p_score: submission.score,
    p_catch_count: submission.catchCount,
  });

  if (error) throw error;
  return data ? rowToEntry(data as ScoreRow) : null;
}

// 상위 랭킹 조회. 정렬: 마릿수 desc → 점수 desc → 먼저 등록한 순.
// 랭킹이 비활성이면 빈 배열을 반환한다.
export async function fetchTopScores(limit = 20): Promise<RankingEntry[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .order("catch_count", { ascending: false })
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data as ScoreRow[]).map(rowToEntry);
}

// 내 기록의 전체 순위(1-based). 나보다 상위(마릿수 큼 또는 마릿수 같고 점수 큼)인 기록 수 + 1.
// TOP N에 못 든 경우 "내 순위 NN위"를 안내하는 데 쓴다. 비활성이면 null.
export async function fetchMyRank(entry: RankingEntry): Promise<number | null> {
  if (!supabase) return null;

  const { count, error } = await supabase
    .from("scores")
    .select("*", { count: "exact", head: true })
    .or(
      `catch_count.gt.${entry.catchCount},and(catch_count.eq.${entry.catchCount},score.gt.${entry.score})`,
    );

  if (error) throw error;
  return (count ?? 0) + 1;
}

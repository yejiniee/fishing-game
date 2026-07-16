import { describe, expect, it, vi } from "vitest";

// supabase 클라이언트를 비활성(null)으로 고정한다.
// 이렇게 하지 않으면 .env에 실제 키가 있을 때 테스트가 실제 Supabase로 네트워크 요청을 보내
// 결과가 비결정적이 되고, submitScore가 실 DB에 기록을 남기는 부작용이 생긴다.
vi.mock("../supabase", () => ({
  supabase: null,
  isRankingEnabled: false,
}));

import { fetchMyRank, fetchTopScores, rowToEntry, submitScore } from "../ranking";

describe("rowToEntry", () => {
  it("snake_case DB 행을 camelCase 엔트리로 매핑한다", () => {
    const entry = rowToEntry({
      id: "abc",
      device_id: "dev-1",
      nickname: "방어왕",
      score: 42,
      catch_count: 12,
      created_at: "2026-07-16T00:00:00Z",
    });
    expect(entry).toEqual({
      id: "abc",
      deviceId: "dev-1",
      nickname: "방어왕",
      score: 42,
      catchCount: 12,
      createdAt: "2026-07-16T00:00:00Z",
    });
  });
});

describe("랭킹 비활성 환경(supabase 없음)", () => {
  it("submitScore는 null을 반환한다 (네트워크 요청 없음)", async () => {
    await expect(
      submitScore({ nickname: "테스터", score: 10, catchCount: 5 }),
    ).resolves.toBeNull();
  });

  it("fetchTopScores는 빈 배열을 반환한다", async () => {
    await expect(fetchTopScores()).resolves.toEqual([]);
  });

  it("fetchMyRank는 null을 반환한다", async () => {
    const entry = rowToEntry({
      id: "x",
      device_id: "d",
      nickname: "나",
      score: 1,
      catch_count: 1,
      created_at: "2026-07-16T00:00:00Z",
    });
    await expect(fetchMyRank(entry)).resolves.toBeNull();
  });
});

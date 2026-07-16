import { describe, expect, it } from "vitest";
import { fetchMyRank, fetchTopScores, rowToEntry, submitScore } from "../ranking";

// 테스트 환경에는 VITE_SUPABASE_* 가 없어 supabase 클라이언트가 null(랭킹 비활성)이다.
// 이때 API가 네트워크 없이 안전한 기본값을 반환하는지 확인한다.

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

describe("랭킹 비활성 환경", () => {
  it("submitScore는 null을 반환한다", async () => {
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

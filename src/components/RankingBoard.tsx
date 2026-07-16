import { useEffect, useState } from "react";
import { fetchMyRank, fetchTopScores } from "../lib/ranking";
import { isRankingEnabled } from "../lib/supabase";
import type { RankingEntry } from "../types/ranking";

interface RankingBoardProps {
  myDeviceId: string; // 내 행 하이라이트용
  myEntry?: RankingEntry | null; // 방금 등록한 내 기록 (TOP N 밖이면 순위 계산에 사용)
  limit?: number;
  onEditNickname?: () => void; // 있으면 헤더 오른쪽에 "이름 변경" 버튼을 보여준다
}

type Status = "loading" | "error" | "ready";

const MEDALS = ["🥇", "🥈", "🥉"];

function rankLabel(index: number): string {
  return MEDALS[index] ?? `${index + 1}`;
}

function RankingBoard({
  myDeviceId,
  myEntry,
  limit = 20,
  onEditNickname,
}: RankingBoardProps) {
  const [status, setStatus] = useState<Status>("loading");
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isRankingEnabled) {
      setStatus("ready");
      return;
    }

    let cancelled = false;
    setStatus("loading");

    (async () => {
      try {
        const top = await fetchTopScores(limit);
        if (cancelled) return;
        setEntries(top);

        const inList = myEntry
          ? top.some((entry) => entry.deviceId === myDeviceId)
          : false;
        if (myEntry && !inList) {
          const rank = await fetchMyRank(myEntry);
          if (!cancelled) setMyRank(rank);
        } else {
          setMyRank(null);
        }

        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [myDeviceId, myEntry, limit, reloadKey]);

  return (
    <div className="flex w-full max-w-xs flex-col gap-2 rounded-2xl bg-white/95 p-4 text-slate-800 shadow-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold">🏆 랭킹</h3>
        {onEditNickname && (
          <button
            onClick={onEditNickname}
            className="text-xs text-slate-500 underline"
          >
            닉네임 변경
          </button>
        )}
      </div>

      {!isRankingEnabled ? (
        <p className="py-4 text-center text-xs text-slate-400">
          랭킹이 아직 연결되지 않았어요.
        </p>
      ) : status === "loading" ? (
        <p className="py-4 text-center text-xs text-slate-400">
          불러오는 중…
        </p>
      ) : status === "error" ? (
        <div className="flex flex-col items-center gap-2 py-3">
          <p className="text-xs text-rose-500">랭킹을 불러오지 못했어요.</p>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="rounded-full bg-slate-200 px-4 py-1.5 text-xs font-bold text-slate-600 transition active:scale-95"
          >
            다시 시도
          </button>
        </div>
      ) : entries.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-400">
          아직 기록이 없어요. 첫 기록의 주인공이 되어보세요!
        </p>
      ) : (
        <>
          <ol className="flex flex-col gap-1">
            {entries.map((entry, index) => {
              const isMine = entry.deviceId === myDeviceId;
              return (
                <li
                  key={entry.id}
                  className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm ${
                    isMine
                      ? "bg-amber-300 font-extrabold text-slate-900"
                      : "bg-slate-100"
                  }`}
                >
                  <span className="w-6 shrink-0 text-center">
                    {rankLabel(index)}
                  </span>
                  <span className="flex-1 truncate">{entry.nickname}</span>
                  <span className="shrink-0 tabular-nums">
                    {entry.catchCount}마리
                  </span>
                </li>
              );
            })}
          </ol>
          {myRank !== null && (
            <p className="mt-1 text-center text-xs font-semibold text-slate-500">
              내 순위 {myRank}위
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default RankingBoard;

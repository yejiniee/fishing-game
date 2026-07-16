import { useCallback, useEffect, useRef, useState } from "react";
import { nextTitleGap, titleForCatches } from "../lib/titles";
import { getDeviceId } from "../lib/deviceId";
import { getNickname, setNickname as persistNickname } from "../lib/nickname";
import { submitScore } from "../lib/ranking";
import { isRankingEnabled } from "../lib/supabase";
import NicknameInput from "./NicknameInput";
import RankingBoard from "./RankingBoard";
import ShareCard from "./ShareCard";
import type { RankingEntry } from "../types/ranking";

interface GameOverOverlayProps {
  score: number;
  catchCount: number;
  onRestart: () => void;
}

type SubmitState = "idle" | "submitting" | "done" | "error";

function GameOverOverlay({
  score,
  catchCount,
  onRestart,
}: GameOverOverlayProps) {
  const title = titleForCatches(catchCount);
  const gap = nextTitleGap(catchCount);

  const [deviceId] = useState(() => getDeviceId());
  const [nickname, setNicknameState] = useState<string | null>(() => getNickname());
  const [editingNickname, setEditingNickname] = useState(false);
  const [myEntry, setMyEntry] = useState<RankingEntry | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const initRef = useRef(false);

  const register = useCallback(
    async (name: string) => {
      setSubmitState("submitting");
      try {
        const entry = await submitScore({ nickname: name, score, catchCount });
        setMyEntry(entry);
        setSubmitState("done");
      } catch {
        setSubmitState("error");
      }
    },
    [score, catchCount],
  );

  function handleNicknameSubmit(name: string) {
    persistNickname(name);
    setNicknameState(name);
    setEditingNickname(false);
    register(name);
  }

  // 게임오버 진입 시 1회: 저장된 닉네임이 있으면 자동 등록, 없으면 입력창을 연다.
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    if (!isRankingEnabled) return;
    const existing = getNickname();
    if (existing) {
      register(existing);
    } else {
      setEditingNickname(true);
    }
    // 최초 마운트에만 실행 (initRef 가드 — register는 score/catchCount 고정이라 안정적)
  }, [register]);

  // 최초 닉네임 등록 화면: 닉네임을 정하기 전에는 결과 카드·공유·다시하기를 숨긴다.
  const isInitialNicknameEntry =
    isRankingEnabled && editingNickname && nickname === null;

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center gap-2.5 overflow-y-auto rounded-3xl bg-slate-900/60 px-4 py-6 text-center backdrop-blur-sm">
      <span className="text-4xl">🎣</span>
      <h2 className="text-2xl font-extrabold text-white drop-shadow">
        놓쳤다! 게임 종료
      </h2>
      {gap && (
        <p className="text-xs text-white/70">
          다음 칭호 「{gap.title}」까지 {gap.remaining}마리
        </p>
      )}

      {/* 랭킹 영역 */}
      {isRankingEnabled &&
        (editingNickname ? (
          <NicknameInput
            initialValue={nickname ?? ""}
            onSubmit={handleNicknameSubmit}
            onCancel={nickname ? () => setEditingNickname(false) : undefined}
            submitLabel={nickname ? "저장" : "랭킹 등록"}
          />
        ) : (
          <>
            {submitState === "submitting" && (
              <p className="text-xs text-white/70">랭킹에 등록하는 중…</p>
            )}
            {submitState === "error" && nickname && (
              <div className="flex flex-col items-center gap-1">
                <p className="text-xs text-rose-300">랭킹 등록에 실패했어요.</p>
                <button
                  onClick={() => register(nickname)}
                  className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white transition active:scale-95"
                >
                  다시 시도
                </button>
              </div>
            )}
            <RankingBoard myDeviceId={deviceId} myEntry={myEntry} />
            <button
              onClick={() => setEditingNickname(true)}
              className="text-xs text-white/70 underline"
            >
              이름 변경
            </button>
          </>
        ))}

      {/* 결과 카드·공유·다시하기 — 최초 닉네임 등록 전에는 숨긴다 */}
      {!isInitialNicknameEntry && (
        <>
          <ShareCard
            score={score}
            catchCount={catchCount}
            title={title}
            nickname={nickname}
          />

          <button
            onClick={onRestart}
            className="mt-1 rounded-full bg-amber-400 px-8 py-3 text-lg font-extrabold text-slate-900 shadow-lg transition active:scale-95"
          >
            다시하기
          </button>
        </>
      )}
    </div>
  );
}

export default GameOverOverlay;

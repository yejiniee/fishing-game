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

  if (isInitialNicknameEntry) {
    // 최초 닉네임 입력: 입력 컴포넌트를 프레임 세로 정중앙에 둔다.
    // 위·아래 flex-1 스페이서가 같은 높이를 차지해 가운데의 NicknameInput이 정확히 중앙에 온다.
    return (
      <div className="absolute inset-0 z-30 flex flex-col items-center gap-3 overflow-y-auto rounded-3xl bg-slate-900/60 px-4 backdrop-blur-sm">
        {/* 위·아래 flex-1 스페이서가 같은 높이를 차지하고, 바깥 gap-3이 카드 위아래 간격을
            대칭으로 주어 NicknameInput이 정확히 세로 중앙에 온다. */}
        <div className="flex flex-1 flex-col items-center justify-end gap-2.5 text-center">
          <span className="text-4xl">🎣</span>
          <h2 className="text-2xl font-extrabold text-white drop-shadow">
            놓쳤다! 게임 종료
          </h2>
          {gap && (
            <p className="text-xs text-white/70">
              다음 칭호 「{gap.title}」까지 {gap.remaining}마리
            </p>
          )}
        </div>
        <NicknameInput
          initialValue={nickname ?? ""}
          onSubmit={handleNicknameSubmit}
          submitLabel="랭킹 등록"
        />
        <div className="flex-1" />
      </div>
    );
  }

  return (
    <>
      <div className="absolute inset-0 z-30 flex flex-col overflow-y-auto rounded-3xl bg-slate-900/60 backdrop-blur-sm">
        {/* m-auto: 내용이 짧으면 세로 중앙 정렬, 길면 스크롤(상단 잘림 없이) */}
        <div className="m-auto flex w-full flex-col items-center gap-2.5 px-4 py-6 text-center">
          <span className="text-4xl">🎣</span>
          <h2 className="text-2xl font-extrabold text-white drop-shadow">
            놓쳤다! 게임 종료
          </h2>
          {gap && (
            <p className="text-xs text-white/70">
              다음 칭호 「{gap.title}」까지 {gap.remaining}마리
            </p>
          )}

          {/* 결과 카드 + [재도전][공유하기] 버튼 한 줄 (위) */}
          <ShareCard
            score={score}
            catchCount={catchCount}
            title={title}
            nickname={nickname}
            onRestart={onRestart}
          />

          {/* 랭킹 영역 (아래) — 이름 변경 중에도 화면 그대로 유지, 입력은 모달로 띄운다 */}
          {isRankingEnabled && (
            <div className="mt-2.5 flex w-full flex-col items-center gap-2.5">
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
              <RankingBoard
                myDeviceId={deviceId}
                myEntry={myEntry}
                onEditNickname={() => setEditingNickname(true)}
              />
            </div>
          )}
        </div>
      </div>

      {/* 이름 변경 모달 — 뒤 화면(랭킹 등)을 그대로 둔 채 위에 띄운다 */}
      {editingNickname && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center rounded-3xl bg-black/60 p-4"
          onClick={() => setEditingNickname(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <NicknameInput
              initialValue={nickname ?? ""}
              onSubmit={handleNicknameSubmit}
              onCancel={() => setEditingNickname(false)}
              submitLabel="저장"
            />
          </div>
        </div>
      )}
    </>
  );
}

export default GameOverOverlay;

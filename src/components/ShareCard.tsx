import { useRef, useState } from "react";
import {
  buildFileName,
  buildShareText,
  createCardBlob,
  shareOrDownloadImage,
} from "../lib/shareImage";

interface ShareCardProps {
  score: number;
  catchCount: number;
  title: string;
  nickname?: string | null;
  onRestart: () => void;
}

// 결과 카드 + [재도전][공유하기] 버튼 한 줄. 카드 DOM(cardRef)만 이미지로 캡처하고, 버튼은 캡처에서 제외한다. (PRD §3.9)
function ShareCard({
  score,
  catchCount,
  title,
  nickname,
  onRestart,
}: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function handleShare() {
    if (!cardRef.current || busy) return;
    setBusy(true);
    setError(false);
    try {
      const blob = await createCardBlob(cardRef.current);
      await shareOrDownloadImage(
        blob,
        buildFileName(catchCount),
        buildShareText(catchCount, title),
      );
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={cardRef}
        className="flex w-64 flex-col items-center gap-2 rounded-2xl bg-gradient-to-b from-sky-300 via-cyan-200 to-amber-100 px-5 py-6 text-center"
      >
        <span className="text-xs font-black tracking-wide text-sky-800">
          방어잡기
        </span>
        <span className="text-5xl">🐟</span>
        {nickname && (
          <span className="text-sm font-bold text-slate-700">{nickname}</span>
        )}
        <div className="rounded-full bg-white/70 px-4 py-1 text-xs font-extrabold text-amber-700 shadow-sm">
          🏅 {title}
        </div>
        <div className="mt-1 flex items-end justify-center gap-6 text-slate-800">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-bold text-slate-500">잡은 방어</span>
            <span className="text-2xl font-black leading-none">
              {catchCount}
              <span className="text-sm">마리</span>
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-bold text-slate-500">점수</span>
            <span className="text-2xl font-black leading-none">{score}</span>
          </div>
        </div>
      </div>

      <div className="flex w-64 gap-2">
        <button
          onClick={onRestart}
          className="flex-1 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-200 active:scale-95"
        >
          재도전
        </button>
        <button
          onClick={handleShare}
          disabled={busy}
          className="flex-1 rounded-full bg-sky-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-sky-600 active:scale-95 disabled:opacity-60"
        >
          {busy ? "만드는 중…" : "공유하기"}
        </button>
      </div>
      {error && (
        <p className="text-xs text-rose-300">공유에 실패했어요. 다시 시도해주세요.</p>
      )}
    </div>
  );
}

export default ShareCard;
